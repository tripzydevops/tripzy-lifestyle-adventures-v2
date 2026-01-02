import { supabase } from "../lib/supabase";

export interface YoutubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  publishedAt?: string;
}

// Environment variables for YouTube Integration
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

export const youtubeService = {
  /**
   * Fetches videos from YouTube Data API v3.
   * Requires VITE_YOUTUBE_API_KEY and VITE_YOUTUBE_CHANNEL_ID to be set.
   */
  async fetchFromYouTubeApi(limit: number = 3): Promise<YoutubeVideo[]> {
    if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return [];

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=${limit}&type=video`
      );

      if (!response.ok) {
        console.warn("YouTube API Error:", response.statusText);
        return [];
      }

      const data = await response.json();
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        youtubeId: item.id.videoId,
        title: item.snippet.title, // Note: YouTube API returns HTML entities strings
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error("YouTube SDK Error:", error);
      return [];
    }
  },

  async getFeaturedVideos(limit: number = 3): Promise<YoutubeVideo[]> {
    // 1. Try Live YouTube API first (Automation)
    const liveVideos = await this.fetchFromYouTubeApi(limit);
    if (liveVideos.length > 0) return liveVideos;

    // 2. Fallback to Supabase (Curation / Cache)
    const { data, error } = await supabase
      .schema("blog")
      .from("youtube_videos")
      .select("*")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        youtubeId: item.youtube_id,
        title: item.title,
        thumbnail:
          item.thumbnail_url ||
          `https://img.youtube.com/vi/${item.youtube_id}/maxresdefault.jpg`,
        publishedAt: item.published_at,
      }));
    }

    // 3. Last Resort: Placeholder
    return [
      {
        id: "1",
        youtubeId: "dQw4w9WgXcQ",
        title: "Connect YouTube API or Supabase",
        thumbnail: "https://picsum.photos/seed/tripzy-err/640/360",
      },
    ];
  },
};
