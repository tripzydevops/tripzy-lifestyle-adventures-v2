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
    const { data: posts, error } = await supabase.from("posts").select("*");

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
};
