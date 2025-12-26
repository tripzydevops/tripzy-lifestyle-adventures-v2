


import { Post, PostStatus } from '../types';
import { POSTS_PER_PAGE } from '../constants';
import { supabase } from '../lib/supabase';

export interface PaginatedPostsResponse {
    posts: Post[];
    totalPages: number;
}

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

const mapStatusToSupabase = (status: PostStatus): string => {
  switch (status) {
    case PostStatus.Published: return 'published';
    case PostStatus.Draft: return 'draft';
    case PostStatus.Scheduled: return 'published'; 
    case PostStatus.PendingReview: return 'draft';
    default: return 'draft';
  }
};

const mapStatusFromSupabase = (status: string, publishedAt: string | null): PostStatus => {
  if (status === 'published') {
    if (publishedAt && new Date(publishedAt) > new Date()) {
      return PostStatus.Scheduled;
    }
    return PostStatus.Published;
  }
  if (status === 'archived') return PostStatus.Draft;
  return PostStatus.Draft;
};

const mapPostFromSupabase = (data: any): Post => ({
  id: data.id,
  title: data.title,
  slug: data.slug,
  content: data.content || '',
  excerpt: data.excerpt || '',
  featuredMediaUrl: data.featured_image || '',
  featuredMediaType: data.youtube_url ? 'video' : 'image',
  featuredMediaAlt: data.title,
  category: data.category || 'Uncategorized',
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
});

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (getAllPosts):', error);
      return [];
    }

    return data.map(mapPostFromSupabase);
  },

  async getPublishedPosts(page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();
    
    // Count first
    const { count, error: countError } = await supabase
      .schema('blog')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('published_at', now);

    if (countError) {
      console.error('Supabase Error (getPublishedPosts - count):', countError);
      return { posts: [], totalPages: 0 };
    }

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase Error (getPublishedPosts):', error);
      return { posts: [], totalPages: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return { posts: data.map(mapPostFromSupabase), totalPages };
  },
  
  async searchPosts(query: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    if (!query) return { posts: [], totalPages: 0 };
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema('blog')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('published_at', now)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (countError) {
      console.error('Supabase Error (searchPosts - count):', countError);
      return { posts: [], totalPages: 0 };
    }

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .lte('published_at', now)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase Error (searchPosts):', error);
      return { posts: [], totalPages: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return { posts: data.map(mapPostFromSupabase), totalPages };
  },

  async getPostsByCategory(category: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema('blog')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)
      .eq('status', 'published')
      .lte('published_at', now);

    if (countError) {
      console.error('Supabase Error (getPostsByCategory - count):', countError);
      return { posts: [], totalPages: 0 };
    }

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase Error (getPostsByCategory):', error);
      return { posts: [], totalPages: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return { posts: data.map(mapPostFromSupabase), totalPages };
  },

  async getPostsByTag(tag: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema('blog')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .contains('tags', [tag])
      .eq('status', 'published')
      .lte('published_at', now);

    if (countError) {
      console.error('Supabase Error (getPostsByTag - count):', countError);
      return { posts: [], totalPages: 0 };
    }

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .contains('tags', [tag])
      .eq('status', 'published')
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase Error (getPostsByTag):', error);
      return { posts: [], totalPages: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return { posts: data.map(mapPostFromSupabase), totalPages };
  },
  
  async getPostsByAuthorId(authorId: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    const now = new Date().toISOString();

    const { count, error: countError } = await supabase
      .schema('blog')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .eq('status', 'published')
      .lte('published_at', now);

    if (countError) {
      console.error('Supabase Error (getPostsByAuthorId - count):', countError);
      return { posts: [], totalPages: 0 };
    }

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('author_id', authorId)
      .eq('status', 'published')
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase Error (getPostsByAuthorId):', error);
      return { posts: [], totalPages: 0 };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    return { posts: data.map(mapPostFromSupabase), totalPages };
  },

  async getRelatedPosts(postId: string, category: string): Promise<Post[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .neq('id', postId)
      .eq('category', category)
      .eq('status', 'published')
      .lte('published_at', now)
      .limit(3);

    if (error) {
      console.error('Supabase Error (getRelatedPosts):', error);
      return [];
    }

    return data.map(mapPostFromSupabase);
  },

  async getPostById(id: string): Promise<Post | undefined> {
    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase Error (getPostById):', error);
      return undefined;
    }

    return mapPostFromSupabase(data);
  },
  
  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Supabase Error (getPostBySlug):', error);
      return undefined;
    }

    // Increment views
    if (data.status === 'published') {
      await supabase.rpc('increment_post_views', { post_id: data.id });
    }

    return mapPostFromSupabase(data);
  },

  async createPost(postData: Omit<Post, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'views'>): Promise<Post> {
    const slug = slugify(postData.title);
    const supabaseData = {
      title: postData.title,
      slug: slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: postData.featuredMediaUrl,
      youtube_url: postData.featuredMediaType === 'video' ? postData.featuredMediaUrl : null,
      category: postData.category,
      tags: postData.tags,
      status: mapStatusToSupabase(postData.status),
      author_id: postData.authorId,
      meta_title: postData.metaTitle,
      meta_description: postData.metaDescription,
      meta_keywords: postData.metaKeywords,
      published_at: postData.publishedAt || (postData.status === PostStatus.Published ? new Date().toISOString() : null),
    };

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (createPost):', error);
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
    if (updates.content !== undefined) supabaseUpdates.content = updates.content;
    if (updates.excerpt !== undefined) supabaseUpdates.excerpt = updates.excerpt;
    if (updates.featuredMediaUrl !== undefined) supabaseUpdates.featured_image = updates.featuredMediaUrl;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
    if (updates.status !== undefined) supabaseUpdates.status = mapStatusToSupabase(updates.status);
    if (updates.publishedAt !== undefined) supabaseUpdates.published_at = updates.publishedAt;
    if (updates.metaTitle !== undefined) supabaseUpdates.meta_title = updates.metaTitle;
    if (updates.metaDescription !== undefined) supabaseUpdates.meta_description = updates.metaDescription;
    if (updates.metaKeywords !== undefined) supabaseUpdates.meta_keywords = updates.metaKeywords;
    
    supabaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .schema('blog')
      .from('posts')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (updatePost):', error);
      throw error;
    }

    return mapPostFromSupabase(data);
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .schema('blog')
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase Error (deletePost):', error);
      throw error;
    }
  },
};

