// services/mediaService.ts
import { MediaItem } from '../types';
import { mockMedia } from '../data/mockData';

let media: MediaItem[] = [...mockMedia];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper function to guess media type from URL
const getMediaTypeFromUrl = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase().split('?')[0]; // Ignore query params for extension check

  if (videoExtensions.some(ext => lowerUrl.endsWith(ext))) {
    return 'video';
  }
  // Default to image if it's not a recognized video format
  return 'image';
};


export const mediaService = {
  async getAllMedia(): Promise<MediaItem[]> {
    await delay(500);
    return [...media].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  async addMedia(mediaData: Omit<MediaItem, 'id' | 'uploadedAt'>): Promise<MediaItem> {
    await delay(100);
    const newMediaItem: MediaItem = {
      ...mediaData,
      id: `m${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    media.unshift(newMediaItem);
    return newMediaItem;
  },

  async importMediaFromUrl(url: string): Promise<MediaItem> {
    await delay(1500); // Simulate fetching the media
    
    try {
      // Basic URL validation
      new URL(url); 
    } catch (_) {
      throw new Error('Invalid URL provided.');
    }
    
    const mediaType = getMediaTypeFromUrl(url);
    const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'imported_media';

    // In a real app, you'd download the file, upload it to your storage,
    // and then use the new storage URL. Here, we just use the original URL.
    return this.addMedia({
      url,
      fileName,
      mediaType,
    });
  },
};