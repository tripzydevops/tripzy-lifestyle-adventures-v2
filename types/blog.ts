
export type BlogStatus = "draft" | "published" | "archived";

export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface BlogSeo {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl?: string;
}

export interface BlogSectionSummary {
  id: string;
  title: string;
  summary: string;
}

export interface BlogSubsection {
  id: string;
  title: string;
  body: string; // Markdown (H3+, lists, code blocks allowed)
}

export interface BlogSection {
  id: string; // matches outline id
  title: string; // H2
  body: string; // Markdown
  subsections?: BlogSubsection[];
}

export interface BlogCallToAction {
  label: string;
  url: string;
  type: "primary" | "secondary";
}

export interface BlogPost {
  id: string; // slug, e.g. "getting-started-with-antigravity"
  title: string;
  subtitle?: string;
  author: BlogAuthor;
  publishedAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  tags: string[]; // kebab-case array, e.g. ["react", "supabase", "tailwind-css"]
  readingTimeMinutes: number;
  seo: BlogSeo;
  heroImageUrl?: string;
  heroImageAlt?: string;
  outline: {
    sections: BlogSectionSummary[];
  };
  content: {
    sections: BlogSection[];
  };
  callToAction?: BlogCallToAction;
  status: BlogStatus;
  language: string; // e.g. "en-US"
}
