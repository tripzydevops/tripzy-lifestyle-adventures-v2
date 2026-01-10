export enum UserRole {
  Administrator = "Administrator",
  Editor = "Editor",
  Author = "Author",
}

export interface User {
  id: string;
  slug: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  isBanned?: boolean;
  xp?: number;
  level?: number;
}

export enum PostStatus {
  Published = "Published",
  Draft = "Draft",
  PendingReview = "Pending Review",
  Scheduled = "Scheduled",
}

export interface IntelligenceMetadata {
  intent?: string;
  lifestyleVibe?: string;
  constraints?: string[];
  reasoning?: string;
  confidence?: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredMediaUrl: string;
  featuredMediaType: "image" | "video";
  featuredMediaAlt?: string;
  category: string;
  tags: string[];
  authorId: string;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  intelligenceMetadata?: IntelligenceMetadata;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryFont: string;
  secondaryFont: string;
  seo?: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
  mediaType: "image" | "video";
  altText?: string;
  caption?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags?: string[];
}
