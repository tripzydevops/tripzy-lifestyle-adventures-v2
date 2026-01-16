// services/mediaService.ts - v2.1.1
import { MediaItem } from "../types";
import { supabase } from "../lib/supabase";
import { embeddingService } from "./embeddingService";

const getMediaTypeFromMime = (
  mime: string | null,
  url: string
): "image" | "video" => {
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("image/")) return "image";

  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  const lowerUrl = url.toLowerCase().split("?")[0];
  if (videoExtensions.some((ext) => lowerUrl.endsWith(ext))) return "video";

  return "image";
};

const mapMediaFromSupabase = (data: any): MediaItem => ({
  id: data.id,
  url: data.url,
  fileName: data.filename || "unnamed",
  uploadedAt: data.created_at,
  mediaType: getMediaTypeFromMime(data.mime_type, data.url),
  altText: data.alt_text,
  caption: data.caption,
  mimeType: data.mime_type,
  sizeBytes: data.size_bytes,
  tags: data.tags || [],
});

export const mediaService = {
  async getMedia(
    page: number = 1,
    limit: number = 20,
    search?: string,
    type: "all" | "image" | "video" = "all"
  ): Promise<{ data: MediaItem[]; count: number }> {
    let query = supabase
      .schema("blog")
      .from("media")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`filename.ilike.%${search}%,alt_text.ilike.%${search}%`);
    }

    if (type !== "all") {
      if (type === "video") {
        query = query.ilike("mime_type", "video/%");
      } else {
        query = query.ilike("mime_type", "image/%");
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase Error (getMedia):", error);
      return { data: [], count: 0 };
    }

    return {
      data: data.map(mapMediaFromSupabase),
      count: count || 0,
    };
  },

  // Deprecated but kept for compatibility if needed elsewhere
  async getAllMedia(): Promise<MediaItem[]> {
    return (await this.getMedia(1, 1000)).data;
  },

  async findDuplicateMedia(
    fileName: string,
    sizeBytes: number
  ): Promise<MediaItem | null> {
    const { data, error } = await supabase
      .schema("blog")
      .from("media")
      .select("*")
      .eq("filename", fileName) // check filename matches
      .eq("size_bytes", sizeBytes) // check exact size matches
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase Error (findDuplicateMedia):", error);
      return null;
    }

    return data ? mapMediaFromSupabase(data) : null;
  },

  async addMedia(
    mediaData: Omit<MediaItem, "id" | "uploadedAt">
  ): Promise<MediaItem> {
    const supabaseData: any = {
      url: mediaData.url,
      filename: mediaData.fileName,
      mime_type: mediaData.mediaType === "video" ? "video/mp4" : "image/jpeg",
      size_bytes: mediaData.sizeBytes,
      tags: mediaData.tags || [],
      alt_text: mediaData.altText,
      caption: mediaData.caption,
      embedding: null,
    };

    // Generate embedding
    const textToEmbed = `${mediaData.fileName} ${mediaData.caption || ""} ${
      mediaData.altText || ""
    } ${(mediaData.tags || []).join(" ")}`;
    try {
      const embedding = await embeddingService.generateEmbedding(textToEmbed);
      if (embedding) {
        supabaseData.embedding = embedding;
      }
    } catch (e) {
      console.warn("Failed to generate embedding for media:", e);
    }

    const { data: blogMedia, error: blogError } = await supabase
      .schema("blog")
      .from("media")
      .insert([supabaseData])
      .select()
      .single();

    if (blogError) {
      console.error("Supabase Error (addMedia -> blog.media):", blogError);
      throw blogError;
    }

    // --- DUAL WRITE: Sync to public.media_library ---
    try {
      // Extract storage path from URL
      const storagePath =
        mediaData.url.split("/blog-media/")[1]?.split("?")[0] ||
        mediaData.fileName;

      const libraryData = {
        public_url: mediaData.url.split("?")[0], // Clean URL
        storage_path: storagePath,
        title: mediaData.caption || mediaData.fileName,
        alt_text: mediaData.altText,
        semantic_tags: mediaData.tags || [],
        ai_description: mediaData.caption || "",
        embedding: supabaseData.embedding,
        size_bytes: mediaData.sizeBytes,
        file_format: mediaData.fileName.split(".").pop()?.toLowerCase(),
      };

      await supabase
        .from("media_library")
        .upsert([libraryData], { onConflict: "public_url" });
    } catch (libErr) {
      console.warn("Dual Write to media_library failed (addMedia):", libErr);
    }

    return mapMediaFromSupabase(blogMedia);
  },

  async importMediaFromUrl(url: string): Promise<MediaItem> {
    try {
      new URL(url);
    } catch (_) {
      throw new Error("Invalid URL provided.");
    }

    const fileName =
      url.substring(url.lastIndexOf("/") + 1).split("?")[0] || "imported_media";
    const mediaType = getMediaTypeFromMime(null, url);

    return this.addMedia({
      url,
      fileName,
      mediaType,
    });
  },

  async updateMedia(
    id: string,
    updates: Partial<MediaItem>
  ): Promise<MediaItem> {
    const supabaseUpdates: any = {};
    if (updates.fileName !== undefined)
      supabaseUpdates.filename = updates.fileName;
    if (updates.altText !== undefined)
      supabaseUpdates.alt_text = updates.altText;
    if (updates.caption !== undefined)
      supabaseUpdates.caption = updates.caption;
    if (updates.mimeType !== undefined)
      supabaseUpdates.mime_type = updates.mimeType;
    if (updates.sizeBytes !== undefined)
      supabaseUpdates.size_bytes = updates.sizeBytes;
    if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;

    // Regenerate embedding if relevant fields change
    if (
      updates.fileName !== undefined ||
      updates.altText !== undefined ||
      updates.caption !== undefined ||
      updates.tags !== undefined
    ) {
      try {
        // Fetch current state to merge
        const { data: current } = await supabase
          .schema("blog")
          .from("media")
          .select("*")
          .eq("id", id)
          .single();
        if (current) {
          const merged = {
            ...current,
            ...updates,
            tags: updates.tags || current.tags,
          };
          // Use updated fields or fallback to current
          const fName = updates.fileName ?? current.filename;
          const fCapt = updates.caption ?? current.caption;
          const fAlt = updates.altText ?? current.alt_text;

          const textToEmbed = `${fName} ${fCapt || ""} ${fAlt || ""} ${(
            merged.tags || []
          ).join(" ")}`;

          const embedding = await embeddingService.generateEmbedding(
            textToEmbed
          );
          if (embedding) {
            supabaseUpdates.embedding = embedding;
          }
        }
      } catch (e) {
        console.warn("Update embedding failed:", e);
      }
    }

    const { data: blogMedia, error: blogError } = await supabase
      .schema("blog")
      .from("media")
      .update(supabaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (blogError) {
      console.error("Supabase Error (updateMedia):", blogError);
      throw blogError;
    }

    // --- DUAL WRITE: Sync to public.media_library ---
    try {
      const cleanUrl = blogMedia.url.split("?")[0];
      const storagePath =
        cleanUrl.split("/blog-media/")[1]?.split("?")[0] || blogMedia.filename;

      const libraryUpdate: any = {
        public_url: cleanUrl,
        storage_path: storagePath,
        title: blogMedia.caption || blogMedia.filename,
        alt_text: blogMedia.alt_text,
        semantic_tags: blogMedia.tags || [],
        ai_description: blogMedia.caption || "",
        size_bytes: blogMedia.size_bytes,
        file_format: blogMedia.filename.split(".").pop()?.toLowerCase(),
        embedding: supabaseUpdates.embedding || blogMedia.embedding,
      };

      await supabase
        .from("media_library")
        .upsert([libraryUpdate], { onConflict: "public_url" });
    } catch (libErr) {
      console.warn("Dual Write to media_library failed (updateMedia):", libErr);
    }

    return mapMediaFromSupabase(blogMedia);
  },

  async deleteMedia(id: string): Promise<void> {
    const { error } = await supabase
      .schema("blog")
      .from("media")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase Error (deleteMedia):", error);
      throw error;
    }
  },
};
