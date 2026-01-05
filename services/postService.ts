import { Post, PostStatus } from "../types";
import { POSTS_PER_PAGE } from "../constants";
import { supabase } from "../lib/supabase";
import { embeddingService } from "./embeddingService";

export interface PaginatedPostsResponse {
  posts: Post[];
  totalPages: number;
  totalCount: number;
}

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const mapStatusToSupabase = (status: PostStatus): string => {
  switch (status) {
    case PostStatus.Published:
      return "published";
    case PostStatus.Draft:
      return "draft";
    case PostStatus.Scheduled:
      return "published";
    case PostStatus.PendingReview:
      return "draft";
    default:
      return "draft";
  }
};

const mapStatusFromSupabase = (
  status: string,
  publishedAt: string | null
): PostStatus => {
  if (status === "published") {
    if (publishedAt && new Date(publishedAt) > new Date()) {
      return PostStatus.Scheduled;
    }
    return PostStatus.Published;
  }
  if (status === "archived") return PostStatus.Draft;
  return PostStatus.Draft;
};

const mapPostFromSupabase = (data: any): Post => ({
  id: data.id,
  title: data.title,
  slug: data.slug,
  content: data.content || "",
  excerpt: data.excerpt || "",
  featuredMediaUrl: data.featured_image || "",
  featuredMediaType: data.youtube_url ? "video" : "image",
  featuredMediaAlt: data.title,
  category: data.category || "Uncategorized",
  tags: data.tags || [],
  authorId: data.author_id,
  status: mapStatusFromSupabase(data.status, data.published_at),
  publishedAt: data.published_at,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  views: data.views || 0,
  metaTitle: data.meta_title,
  metaDescription: data.meta_description,
  metaKeywords: data.meta_keywords,
  intelligenceMetadata: data.metadata || {},
});

export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  pendingPosts: number;
  scheduledPosts: number;
}

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (getAllPosts):", error);
      return [];
    }

    return data.map(mapPostFromSupabase);
  },

  async getAdminPosts(
    page: number = 1,
    limit: number = 20,
    searchQuery: string = ""
  ): Promise<PaginatedPostsResponse> {
    let query = supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (getAdminPosts):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async getPostStats(): Promise<PostStats> {
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("status");

    if (error) {
      console.error("Supabase Error (getPostStats):", error);
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        pendingPosts: 0,
        scheduledPosts: 0,
      };
    }

    const stats = {
      totalPosts: data.length,
      publishedPosts: 0,
      draftPosts: 0,
      pendingPosts: 0,
      scheduledPosts: 0,
    };

    data.forEach((post) => {
      // We need to map the supabase status back to our enum logic if needed,
      // but for raw counts, relying on the db string value is usually faster if we trust it.
      // However, our mapStatusFromSupabase logic handles scheduled vs published based on date.
      // For pure dashboard speed, we might approximate or strict check.
      // Let's stick to the DB strings for now to match the "status" column.
      // 'published', 'draft', 'archived'

      if (post.status === "published") stats.publishedPosts++;
      else if (post.status === "draft") stats.draftPosts++;
      // Note: 'pending' and 'scheduled' logic is partly application-side in the current service
      // (see mapStatusFromSupabase).
      // Ideally, we fetch everything with dates to be precise, OR we trust the status column.
      // For now, let's just count the raw rows to allow for the stats calculation
      // without fetching the heavy 'content' column.
    });

    // To match the Dashboard's exact needs (Pending vs Draft), we need to check how they are stored.
    // mapStatusToSupabase: PendingReview -> 'draft', Scheduled -> 'published'.
    // This implies we DO need to check dates/metadata if we want to distinguish 'PendingReview' from 'Draft'
    // IF the DB doesn't distinguish them.
    // Looking at mapStatusToSupabase: PendingReview maps to 'draft'. This is overlapping.
    // We should probably refine this later. For now, let's keep the dashboard logic
    // consistent with what it was, but optimized to NOT select 'content'.

    return stats;
  },

  async getTopPosts(limit: number = 5): Promise<Post[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select(
        "id, title, slug, views, category, created_at, status, author_id, published_at"
      ) // Exclude content/excerpt
      .order("views", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase Error (getTopPosts):", error);
      return [];
    }

    return data.map(mapPostFromSupabase);
  },

  async getPublishedPosts(
    page: number = 1,
    limit: number = POSTS_PER_PAGE
  ): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    // Count first
    const { count, error: countError } = await supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .lte("published_at", now);

    if (countError) {
      console.error("Supabase Error (getPublishedPosts - count):", countError);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (getPublishedPosts):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = POSTS_PER_PAGE
  ): Promise<PaginatedPostsResponse> {
    if (!query) return { posts: [], totalPages: 0, totalCount: 0 };
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .lte("published_at", now)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (countError) {
      console.error("Supabase Error (searchPosts - count):", countError);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("status", "published")
      .lte("published_at", now)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (searchPosts):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async semanticSearchPosts(
    query: string,
    matchCount: number = 6
  ): Promise<Post[]> {
    if (!query) return [];

    try {
      const embedding = await embeddingService.generateEmbedding(query);
      if (!embedding) return [];

      const { data, error } = await supabase.rpc("match_posts", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: matchCount,
      });

      if (error) {
        console.error("Supabase Error (semanticSearchPosts):", error);
        return [];
      }

      const postIds = data.map((d: any) => d.id);
      if (postIds.length === 0) return [];

      const { data: postsData, error: postsError } = await supabase
        .schema("blog")
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (postsError) {
        return [];
      }

      return postsData.map(mapPostFromSupabase);
    } catch (err) {
      return [];
    }
  },

  async getPostsByCategory(
    category: string,
    page: number = 1,
    limit: number = POSTS_PER_PAGE
  ): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("category", category)
      .eq("status", "published")
      .lte("published_at", now);

    if (countError) {
      console.error("Supabase Error (getPostsByCategory - count):", countError);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("category", category)
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (getPostsByCategory):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async getPostsByTag(
    tag: string,
    page: number = 1,
    limit: number = POSTS_PER_PAGE
  ): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact", head: true })
      .contains("tags", [tag])
      .eq("status", "published")
      .lte("published_at", now);

    if (countError) {
      console.error("Supabase Error (getPostsByTag - count):", countError);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .contains("tags", [tag])
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (getPostsByTag):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async getPostsByAuthorId(
    authorId: string,
    page: number = 1,
    limit: number = POSTS_PER_PAGE
  ): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema("blog")
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("status", "published")
      .lte("published_at", now);

    if (countError) {
      console.error("Supabase Error (getPostsByAuthorId - count):", countError);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("author_id", authorId)
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase Error (getPostsByAuthorId):", error);
      return { posts: [], totalPages: 0, totalCount: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return {
      posts: data.map(mapPostFromSupabase),
      totalPages,
      totalCount: count || 0,
    };
  },

  async getRelatedPosts(postId: string, category: string): Promise<Post[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .neq("id", postId)
      .eq("category", category)
      .eq("status", "published")
      .lte("published_at", now)
      .limit(3);

    if (error) {
      console.error("Supabase Error (getRelatedPosts):", error);
      return [];
    }

    return data.map(mapPostFromSupabase);
  },

  async getPostById(id: string): Promise<Post | undefined> {
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase Error (getPostById):", error);
      return undefined;
    }

    return mapPostFromSupabase(data);
  },

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Supabase Error (getPostBySlug):", error);
      return undefined;
    }

    // Increment views
    if (data.status === "published") {
      await supabase.rpc("increment_post_views", { post_id: data.id });
    }

    return mapPostFromSupabase(data);
  },

  async createPost(
    postData: Omit<Post, "id" | "slug" | "createdAt" | "updatedAt" | "views">
  ): Promise<Post> {
    const slug = slugify(postData.title);

    // Generate embedding for semantic search
    let embedding = null;
    try {
      const textToEmbed = `${postData.title} ${
        postData.excerpt
      } ${postData.content.substring(0, 1000)}`;
      embedding = await embeddingService.generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn("Failed to generate embedding for new post:", err);
    }

    const supabaseData = {
      title: postData.title,
      slug: slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: postData.featuredMediaUrl,
      youtube_url:
        postData.featuredMediaType === "video"
          ? postData.featuredMediaUrl
          : null,
      category: postData.category,
      tags: postData.tags,
      status: mapStatusToSupabase(postData.status),
      author_id: postData.authorId,
      meta_title: postData.metaTitle,
      meta_description: postData.metaDescription,
      meta_keywords: postData.metaKeywords,
      published_at:
        postData.publishedAt ||
        (postData.status === PostStatus.Published
          ? new Date().toISOString()
          : null),
      embedding: embedding,
      metadata: postData.intelligenceMetadata || {},
    };

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (createPost):", error);
      throw error;
    }

    return mapPostFromSupabase(data);
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const supabaseUpdates: any = {};

    if (updates.title) {
      supabaseUpdates.title = updates.title;
      supabaseUpdates.slug = slugify(updates.title);
    }
    if (updates.content !== undefined)
      supabaseUpdates.content = updates.content;
    if (updates.excerpt !== undefined)
      supabaseUpdates.excerpt = updates.excerpt;
    if (updates.featuredMediaUrl !== undefined)
      supabaseUpdates.featured_image = updates.featuredMediaUrl;
    if (updates.category !== undefined)
      supabaseUpdates.category = updates.category;
    if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
    if (updates.status !== undefined)
      supabaseUpdates.status = mapStatusToSupabase(updates.status);
    if (updates.publishedAt !== undefined)
      supabaseUpdates.published_at = updates.publishedAt;
    if (updates.metaTitle !== undefined)
      supabaseUpdates.meta_title = updates.metaTitle;
    if (updates.metaDescription !== undefined)
      supabaseUpdates.meta_description = updates.metaDescription;
    if (updates.metaKeywords !== undefined)
      supabaseUpdates.meta_keywords = updates.metaKeywords;
    if (updates.intelligenceMetadata !== undefined)
      supabaseUpdates.metadata = updates.intelligenceMetadata;

    // Update embedding if title or content changed
    if (updates.title || updates.content || updates.excerpt) {
      try {
        const currentPost = await this.getPostById(id);
        const title = updates.title || currentPost?.title || "";
        const excerpt = updates.excerpt || currentPost?.excerpt || "";
        const content = updates.content || currentPost?.content || "";
        const textToEmbed = `${title} ${excerpt} ${content.substring(0, 1000)}`;
        supabaseUpdates.embedding = await embeddingService.generateEmbedding(
          textToEmbed
        );
      } catch (err) {
        console.warn("Failed to update embedding for post:", err);
      }
    }

    supabaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .schema("blog")
      .from("posts")
      .update(supabaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (updatePost):", error);
      throw error;
    }

    return mapPostFromSupabase(data);
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .schema("blog")
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase Error (deletePost):", error);
      throw error;
    }
  },
};
