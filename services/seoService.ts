import { supabase } from "../lib/supabase";
import { Post } from "../types";

export interface SEOIssue {
  id: string;
  postId: string;
  postTitle: string;
  severity: "critical" | "warning" | "info";
  message: string;
  type: "meta" | "content" | "link" | "image";
}

export const seoService = {
  async runHealthCheck(): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];

    // Fetch all posts
    const { data: posts, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*");

    if (error || !posts) {
      console.error("Failed to fetch posts for SEO check", error);
      return [];
    }

    posts.forEach((post: any) => {
      // 1. Check Meta Tags
      // Supabase returns snake_case keys by default
      const title = post.meta_title || post.metaTitle;
      const desc = post.meta_description || post.metaDescription;
      const image = post.featured_image || post.featuredMediaUrl;
      const keywords = post.meta_keywords || post.metaKeywords;

      if (!title || title.length < 10) {
        issues.push({
          id: `meta-title-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "critical",
          message: "Missing or too short Meta Title.",
          type: "meta",
        });
      }

      if (!desc || desc.length < 50) {
        issues.push({
          id: `meta-desc-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "warning",
          message:
            "Meta Description is missing or too short (aim for 150-160 chars).",
          type: "meta",
        });
      }

      // 2. Check Content
      const wordCount = (post.content || "").split(/\s+/).length;
      if (wordCount < 300) {
        issues.push({
          id: `content-len-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "warning",
          message: `Content is thin (${wordCount} words). Aim for at least 600 words for better SEO.`,
          type: "content",
        });
      }

      // 3. Check Images
      if (!image) {
        issues.push({
          id: `img-missing-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "critical",
          message: "Missing Featured Image.",
          type: "image",
        });
      }

      // 4. Check Keywords (Basic)
      if (!keywords) {
        issues.push({
          id: `kw-missing-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "info",
          message: "No focus keywords defined.",
          type: "meta",
        });
      }
    });

    return issues;
  },

  calculateHealthScore(issues: SEOIssue[], totalPosts: number): number {
    if (totalPosts === 0) return 100;

    // Penalties
    const criticalWeight = 10;
    const warningWeight = 5;
    const infoWeight = 1;

    let penaltyPoints = 0;
    issues.forEach((issue) => {
      if (issue.severity === "critical") penaltyPoints += criticalWeight;
      else if (issue.severity === "warning") penaltyPoints += warningWeight;
      else penaltyPoints += infoWeight;
    });

    // Normalize score 0-100
    // Arbitrary baseline: Assume perfectly bad site has 20 pts penalty per post
    const maxPenalty = totalPosts * 20;
    const score = 100 - (penaltyPoints / maxPenalty) * 100;

    return Math.max(0, Math.round(score));
  },

  async fixIssue(
    issue: SEOIssue
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Fetch Post
      const { data: post, error } = await supabase
        .schema("blog")
        .from("posts")
        .select("*")
        .eq("id", issue.postId)
        .single();

      if (error || !post)
        return { success: false, message: "Post not found or DB error" };

      const updates: any = {};
      let fixed = false;

      // 2. Fix based on type
      if (issue.type === "image") {
        try {
          const { createApi } = await import("unsplash-js");
          const unsplash = createApi({
            accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY,
          });

          // Search Strategy: Exact Title -> Tags -> Generic "Travel"
          // We sanitize the title slightly to remove punctuation that might confuse search
          const cleanTitle = post.title
            .replace(/[^\w\s\u00C0-\u017F]/g, "")
            .trim();
          const queries = [
            post.title,
            // Extract first meaningful word or two
            cleanTitle.split(" ").slice(0, 2).join(" "),
            "Travel",
          ];

          let foundImage = null;

          for (const query of queries) {
            if (!query || query.length < 3) continue;
            try {
              console.log(`Trying Unsplash search: ${query}`);
              const result = await unsplash.search.getPhotos({
                query: query,
                perPage: 1,
                orientation: "landscape",
              });
              if (result.response?.results.length > 0) {
                foundImage = result.response.results[0].urls.regular;
                break; // Found one!
              }
            } catch (ign) {
              continue;
            }
          }

          if (foundImage) {
            updates.featured_image = foundImage;
            fixed = true;
          } else {
            return {
              success: false,
              message:
                "No relevant image found on Unsplash (tried title & generic terms)",
            };
          }
        } catch (e: any) {
          return { success: false, message: `Unsplash Error: ${e.message}` };
        }
      } else if (issue.type === "meta" || issue.type === "content") {
        // Fix Metadata using AI
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(
            import.meta.env.VITE_GEMINI_API_KEY
          );
          // Revert to backend-aligned model which is known to work with this key
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
          });

          const prompt = `
            Generate SEO metadata for this blog post.
            Title: ${post.title}
            Excerpt: ${post.excerpt || post.content.substring(0, 200)}
            
            Return JSON:
            {
              "metaTitle": "SEO optimized title > 40 chars",
              "metaDescription": "Engaging summary 130-160 chars",
              "metaKeywords": "5-8 comma separated keywords"
            }
            `;

          const result = await model.generateContent(prompt);
          const text = result.response.text();

          // Robust JSON extraction
          let jsonStr = text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }

          let data;
          try {
            data = JSON.parse(jsonStr);
          } catch (jsonErr) {
            console.error("JSON Parse Error:", jsonErr, "Raw Text:", text);
            return {
              success: false,
              message: "AI response was not valid JSON",
            };
          }

          if (data) {
            if (issue.message.includes("Title"))
              updates.meta_title = data.metaTitle;
            if (issue.message.includes("Description"))
              updates.meta_description = data.metaDescription;
            if (issue.message.includes("keywords"))
              updates.meta_keywords = data.metaKeywords;

            // If we are running AI, might as well update all empty fields
            if (!post.meta_title) updates.meta_title = data.metaTitle;
            if (!post.meta_description)
              updates.meta_description = data.metaDescription;
            if (!post.meta_keywords) updates.meta_keywords = data.metaKeywords;

            fixed = true;
          }
        } catch (aiErr: any) {
          console.error("AI Error:", aiErr);
          return {
            success: false,
            message: `AI Error: ${aiErr.message || aiErr}`,
          };
        }
      }

      // 3. Update Post
      if (fixed && Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .schema("blog")
          .from("posts")
          .update(updates)
          .eq("id", post.id);

        if (updateError) {
          return {
            success: false,
            message: `DB Update Failed: ${updateError.message}`,
          };
        }
        return { success: true };
      }

      return { success: false, message: "No updates were generated" };
    } catch (err: any) {
      console.error("Auto-fix failed", err);
      return {
        success: false,
        message: `Unknown Error: ${err.message || err}`,
      };
    }
  },
};
