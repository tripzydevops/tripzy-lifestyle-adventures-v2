// services/uploadService.ts
import { mediaService } from "./mediaService";
import { supabase } from "../lib/supabase";

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
   * Uploads an image or video file to Supabase Storage.
   * @param file The file to upload.
   * @returns The public URL of the uploaded file.
   */
  async uploadFile(file: File): Promise<string> {
    console.log(
      `Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
    );

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("blog-media")
      .upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const publicUrl = getPublicUrl(uniqueFileName);

    // Determine media type
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    // Add the new item to the media library database
    await mediaService.addMedia({
      url: publicUrl,
      fileName: file.name,
      mediaType: mediaType,
    });

    console.log(`File uploaded successfully. URL: ${publicUrl}`);
    return publicUrl;
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
