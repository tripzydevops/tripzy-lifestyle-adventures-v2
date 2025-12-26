// services/uploadService.ts
import { mediaService } from './mediaService';
import { supabase } from '../lib/supabase';

/**
 * Generates a unique filename by appending a timestamp
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitized}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Get the public URL for an uploaded file
 */
const getPublicUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('blog-media')
    .getPublicUrl(fileName);
  return data.publicUrl;
};

export const uploadService = {
  /**
   * Uploads an image or video file to Supabase Storage.
   * @param file The file to upload.
   * @returns The public URL of the uploaded file.
   */
  async uploadFile(file: File): Promise<string> {
    console.log(`Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name);
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('blog-media')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const publicUrl = getPublicUrl(uniqueFileName);
    
    // Determine media type
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    
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
   * Deletes a file from Supabase Storage.
   * @param fileName The name of the file to delete (extracted from URL).
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/blog-media/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }
      const fileName = urlParts[1];

      const { error } = await supabase.storage
        .from('blog-media')
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      console.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};