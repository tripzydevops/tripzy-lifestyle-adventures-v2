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
  async getAllMedia(): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (getAllMedia):", error);
      return [];
    }

    return data.map(mapMediaFromSupabase);
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
    const supabaseData = {
      url: mediaData.url,
      filename: mediaData.fileName, // Correct column name is 'filename' without underscore
      mime_type: mediaData.mediaType === "video" ? "video/mp4" : "image/jpeg",
      size_bytes: mediaData.sizeBytes,
      tags: mediaData.tags || [],
      embedding: null, // Initialize
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

    const { data, error } = await supabase
      .schema("blog")
      .from("media")
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (addMedia):", error);
      throw error;
    }

    return mapMediaFromSupabase(data);
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

    const { data, error } = await supabase
      .schema("blog")
      .from("media")
      .update(supabaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (updateMedia):", error);
      throw error;
    }

    return mapMediaFromSupabase(data);
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
