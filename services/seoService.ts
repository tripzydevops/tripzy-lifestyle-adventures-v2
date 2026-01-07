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

    posts.forEach((post: Post) => {
      // 1. Check Meta Tags
      if (!post.metaTitle || post.metaTitle.length < 10) {
        issues.push({
          id: `meta-title-${post.id}`,
          postId: post.id,
          postTitle: post.title,
          severity: "critical",
          message: "Missing or too short Meta Title.",
          type: "meta",
        });
      }

      if (!post.metaDescription || post.metaDescription.length < 50) {
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
      const wordCount = post.content.split(/\s+/).length;
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
      if (!post.featuredMediaUrl) {
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
      if (!post.metaKeywords) {
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
          const result = await unsplash.search.getPhotos({
            query: post.title,
            perPage: 1,
            orientation: "landscape",
          });

          if (result.response?.results.length > 0) {
            updates.featured_image = result.response.results[0].urls.regular;
            fixed = true;
          } else {
            return {
              success: false,
              message: "No relevant image found on Unsplash",
            };
          }
        } catch (e: any) {
          return { success: false, message: `Unsplash Error: ${e.message}` };
        }
      } else if (issue.type === "meta" || issue.type === "content") {
        // Fix Metadata using AI
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(
          import.meta.env.VITE_GEMINI_API_KEY
        );
        const model = genAI.getGenerativeModel({
          model: "gemini-pro",
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
        // Clean json
        const jsonStr = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const data = JSON.parse(jsonStr);

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
      }

      // 3. Update Post
      if (fixed && Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .schema("blog")
          .from("posts")
          .update(updates)
          .eq("id", post.id);

        return !updateError;
      }

      return false;
    } catch (err) {
      console.error("Auto-fix failed", err);
      return false;
    }
  },
};
