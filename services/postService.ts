

import { Post, PostStatus } from '../types';
import { mockPosts } from '../data/mockData';
import { POSTS_PER_PAGE } from '../constants';

let posts: Post[] = [...mockPosts];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

export interface PaginatedPostsResponse {
    posts: Post[];
    totalPages: number;
}

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    await delay(500);
    // Return a sorted copy
    return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPublishedPosts(page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    await delay(500);
    const now = new Date();
    const publishedPosts = posts
      .filter(p => 
        (p.status === PostStatus.Published) || 
        (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now)
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

    const totalPages = Math.ceil(publishedPosts.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = publishedPosts.slice(startIndex, startIndex + limit);

    return { posts: paginatedPosts, totalPages };
  },
  
  async searchPosts(query: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    await delay(600);
    if (!query) return { posts: [], totalPages: 0 };

    const lowerCaseQuery = query.toLowerCase();
    const now = new Date();
    const filteredPosts = posts
      .filter(p => 
        (p.status === PostStatus.Published || (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now)) &&
        (p.title.toLowerCase().includes(lowerCaseQuery) || p.content.toLowerCase().includes(lowerCaseQuery))
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
    
    const totalPages = Math.ceil(filteredPosts.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    
    return { posts: paginatedPosts, totalPages };
  },

  async getPostsByCategory(category: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    await delay(500);
    const now = new Date();
    const filteredPosts = posts
      .filter(p => 
        p.category === category &&
        (p.status === PostStatus.Published || (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now))
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

    const totalPages = Math.ceil(filteredPosts.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    
    return { posts: paginatedPosts, totalPages };
  },

  async getPostsByTag(tag: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    await delay(500);
    const now = new Date();
    const filteredPosts = posts
      .filter(p => 
        p.tags.includes(tag) &&
        (p.status === PostStatus.Published || (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now))
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
      
    const totalPages = Math.ceil(filteredPosts.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    
    return { posts: paginatedPosts, totalPages };
  },
  
  async getPostsByAuthorId(authorId: string, page: number = 1, limit: number = POSTS_PER_PAGE): Promise<PaginatedPostsResponse> {
    await delay(500);
    const now = new Date();
    const filteredPosts = posts
      .filter(p => 
        p.authorId === authorId &&
        (p.status === PostStatus.Published || (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now))
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

    const totalPages = Math.ceil(filteredPosts.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);
    
    return { posts: paginatedPosts, totalPages };
  },

  async getRelatedPosts(postId: string, category: string): Promise<Post[]> {
    await delay(400);
    const now = new Date();
    return posts
      .filter(p => 
        p.id !== postId &&
        p.category === category &&
        (p.status === PostStatus.Published || (p.status === PostStatus.Scheduled && p.publishedAt && new Date(p.publishedAt) <= now))
      )
      .slice(0, 3);
  },

  async getPostById(id: string): Promise<Post | undefined> {
    await delay(300);
    const post = posts.find(p => p.id === id);
    // Do not increment view count when fetching for editing purposes.
    return post;
  },
  
  async getPostBySlug(slug: string): Promise<Post | undefined> {
    await delay(300);
    const post = posts.find(p => p.slug === slug);
    // Simulate incrementing view count only for public-facing post views
     if (post && post.status === PostStatus.Published) {
        post.views++;
    }
    return post;
  },

  async createPost(postData: Omit<Post, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'views'>): Promise<Post> {
    await delay(1000);
    const newPost: Post = {
      ...postData,
      id: String(Date.now()),
      slug: slugify(postData.title),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
    };
    posts.unshift(newPost);
    return newPost;
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    await delay(1000);
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }
    
    if (updates.title && updates.title !== posts[postIndex].title) {
        updates.slug = slugify(updates.title);
    }

    posts[postIndex] = { ...posts[postIndex], ...updates, updatedAt: new Date().toISOString() };
    return posts[postIndex];
  },

  async deletePost(id: string): Promise<void> {
    await delay(700);
    posts = posts.filter(p => p.id !== id);
  },
};
