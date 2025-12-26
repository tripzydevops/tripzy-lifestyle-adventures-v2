
import { MediaItem } from '../types';
import { supabase } from '../lib/supabase';

const getMediaTypeFromMime = (mime: string | null, url: string): 'image' | 'video' => {
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('image/')) return 'image';
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase().split('?')[0];
  if (videoExtensions.some(ext => lowerUrl.endsWith(ext))) return 'video';
  
  return 'image';
};

const mapMediaFromSupabase = (data: any): MediaItem => ({
  id: data.id,
  url: data.url,
  fileName: data.file_name || 'unnamed',
  uploadedAt: data.created_at,
  mediaType: getMediaTypeFromMime(data.mime_type, data.url),
});

export const mediaService = {
  async getAllMedia(): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*', { schema: 'blog' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (getAllMedia):', error);
      return [];
    }

    return data.map(mapMediaFromSupabase);
  },

  async addMedia(mediaData: Omit<MediaItem, 'id' | 'uploadedAt'>): Promise<MediaItem> {
    const supabaseData = {
      url: mediaData.url,
      file_name: mediaData.fileName,
      mime_type: mediaData.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
    };

    const { data, error } = await supabase
      .from('media')
      .insert([supabaseData], { schema: 'blog' })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (addMedia):', error);
      throw error;
    }

    return mapMediaFromSupabase(data);
  },

  async importMediaFromUrl(url: string): Promise<MediaItem> {
    try {
      new URL(url); 
    } catch (_) {
      throw new Error('Invalid URL provided.');
    }
    
    const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'imported_media';
    const mediaType = getMediaTypeFromMime(null, url);

    return this.addMedia({
      url,
      fileName,
      mediaType,
    });
  },
};