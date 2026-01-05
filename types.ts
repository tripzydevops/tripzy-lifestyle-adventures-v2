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
  vibe_persona?: string;
  primary_constraint?: string;
  ui_directive?: "immersion" | "high_energy" | "utility";
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

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isApproved?: boolean;
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

export interface GeneratePostParams {
  destination: string;
  language?: "en" | "tr";
  travelStyle?: string;
  targetAudience?: string;
  keyPoints?: string[];
  wordCount?: number;
}

export interface GeneratedPost {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
  suggestedCategory?: string;
  suggestedTags?: string[];
  intelligenceMetadata?: IntelligenceMetadata;
}

export interface SEOResult {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  suggestedSlug: string;
}

export interface GeneratedSocial {
  caption: string;
  hashtags: string[];
  suggestedPostTime: string;
}

export interface GeneratedVideoPrompt {
  prompt: string;
  negativePrompt: string;
  cameraMovement: string;
  modelSettings: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export interface NewsletterCampaign {
  id: string;
  subject: string;
  contentHtml: string;
  status: CampaignStatus;
  sentAt?: string;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UserAchievement {
  achievement: Achievement;
  earnedAt: string;
}

export interface MapItem {
  id: string;
  postId: string;
  name: string;
  type: "markers" | "route" | "polygon";
  centerLat: number;
  centerLng: number;
  zoom: number;
  mapStyle: "streets" | "satellite" | "outdoors" | "light" | "dark";
  data: any[]; // Markers or Route points
  createdAt: string;
}
