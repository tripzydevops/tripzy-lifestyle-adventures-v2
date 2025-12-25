// services/uploadService.ts
import { mediaService } from './mediaService';

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const uploadService = {
  /**
   * Mocks uploading an image or video file.
   * In a real application, this would send the file to a cloud storage service.
   * @param file The file to upload.
   */
  async uploadFile(file: File): Promise<void> {
    console.log(`"Uploading" file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    await delay(1500); // Simulate upload time

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    
    let url = '';
    if (mediaType === 'video') {
      // Use a standard placeholder video. In a real app, this would be the URL from the storage service.
      url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    } else {
      // Use a random image from a placeholder service.
      url = `https://picsum.photos/seed/${Date.now()}/1200/800`;
    }

    // Add the new item to the media library
    await mediaService.addMedia({
        url: url,
        fileName: file.name,
        mediaType: mediaType,
    });
    
    console.log(`File "uploaded". URL: ${url}`);
  },
};