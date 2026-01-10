// services/uploadService.ts
import { mediaService } from "./mediaService";
import { supabase } from "../lib/supabase";
import { aiContentService } from "./aiContentService";

/**
 * Generates a unique filename by appending a timestamp
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
  return `${sanitized}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Get the public URL for an uploaded file
 */
const getPublicUrl = (fileName: string): string => {
  const { data } = supabase.storage.from("blog-media").getPublicUrl(fileName);
  return data.publicUrl;
};

export const uploadService = {
  /**
   * Converts an image to WebP format before upload (client-side)
   */
  async convertToWebP(file: File): Promise<File> {
    if (!file.type.startsWith("image/") || file.type === "image/webp") {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".webp"),
                {
                  type: "image/webp",
                }
              );
              resolve(newFile);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          0.85 // High quality WebP
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Uploads an image or video file to Supabase Storage.
   * @param file The file to upload.
   * @returns The public URL of the uploaded file.
   */
  /**
   * Uploads a file to Supabase Storage without adding it to the media database.
   * Handles WebP conversion and duplicate checking.
   */
  async uploadToStorage(
    file: File,
    options?: { customFileName?: string; upsert?: boolean }
  ): Promise<{
    url: string;
    size: number;
    mimeType: string;
    isDuplicate: boolean;
  }> {
    console.log(
      `[uploadToStorage] Processing: ${file.name} (${(file.size / 1024).toFixed(
        2
      )} KB)`
    );

    // Auto-optimize images to WebP
    let fileToUpload = file;
    if (file.type.startsWith("image/")) {
      try {
        fileToUpload = await this.convertToWebP(file);
      } catch (err) {
        console.warn("WebP conversion failed, using original:", err);
      }
    }

    // Check for duplicates before uploading
    // SKIP duplication check if we are explicitly overwriting (upserting)
    if (!options?.upsert) {
      const existingMedia = await mediaService.findDuplicateMedia(
        fileToUpload.name,
        fileToUpload.size
      );

      if (existingMedia) {
        console.log(`Duplicate found! Using existing media URL`);
        return {
          url: existingMedia.url,
          size: existingMedia.sizeBytes || fileToUpload.size,
          mimeType: existingMedia.mimeType || fileToUpload.type,
          isDuplicate: true,
        };
      }
    }

    // Determine filename: Use custom if provided, otherwise generate unique
    const finalFileName = options?.customFileName
      ? options.customFileName
      : generateUniqueFileName(fileToUpload.name);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("blog-media")
      .upload(finalFileName, fileToUpload, {
        cacheControl: "3600",
        upsert: options?.upsert || false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const publicUrl = getPublicUrl(finalFileName);
    console.log(`File uploaded to storage: ${publicUrl}`);

    return {
      url: publicUrl,
      size: fileToUpload.size,
      mimeType: fileToUpload.type,
      isDuplicate: false,
    };
  },

  /**
   * Uploads an image or video file to Supabase Storage and adds it to the DB.
   * @param file The file to upload.
   * @returns The public URL of the uploaded file.
   */
  async uploadFile(file: File): Promise<string> {
    const { url, size, mimeType, isDuplicate } = await this.uploadToStorage(
      file
    );

    if (isDuplicate) {
      // If duplicate, we return the URL but don't add a new DB entry
      // (Unless we really want to? existing logic returned existingMedia.url and stopped)
      return url;
    }

    // Determine media type
    const mediaType = mimeType.startsWith("video/") ? "video" : "image";

    // AI Metadata Generation for Images
    let altText = "";
    let caption = "";
    let tags: string[] = [];

    if (mediaType === "image") {
      try {
        console.log("Analyzing image with Tripzy AI...");
        const analysis = await aiContentService.analyzeImageFromUrl(url);
        altText = analysis.altText;
        caption = analysis.caption;
        tags = analysis.tags || [];
      } catch (aiErr) {
        console.warn("AI Analysis failed for upload, using defaults:", aiErr);
      }
    }

    // Add the new item to the media library database
    await mediaService.addMedia({
      url: url,
      fileName: file.name, // Use original filename for display
      mediaType: mediaType,
      altText,
      caption,
      tags,
      sizeBytes: size,
    });

    return url;
  },

  /**
   * Bulk upload multiple files
   */
  async uploadMultipleFiles(files: FileList | File[]): Promise<string[]> {
    const urls: string[] = [];
    const fileArray = Array.from(files);

    // We process sequentially to avoid overwhelming storage or DB triggers in some envs,
    // but we could use Promise.all if we wanted massive parallel.
    // Let's do batches of 3.
    for (let i = 0; i < fileArray.length; i++) {
      const url = await this.uploadFile(fileArray[i]);
      urls.push(url);
    }

    return urls;
  },

  /**
   * Deletes a file from Supabase Storage and database.
   * @param id The ID of the media record in the database.
   * @param fileUrl The URL of the file.
   */
  async deleteFile(id: string, fileUrl: string): Promise<void> {
    try {
      // 1. Delete from database first (if this fails, we still have the file)
      await mediaService.deleteMedia(id);

      // 2. Extract the file path from the URL and delete from storage
      const urlParts = fileUrl.split("/blog-media/");
      if (urlParts.length < 2) {
        console.warn(
          "Could not extract filename from URL for storage deletion:",
          fileUrl
        );
      } else {
        const fileName = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from("blog-media")
          .remove([fileName]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
          // We don't throw here because the DB record is already gone
        }
      }

      console.log(`Media deleted successfully: ${id}`);
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  },
};
