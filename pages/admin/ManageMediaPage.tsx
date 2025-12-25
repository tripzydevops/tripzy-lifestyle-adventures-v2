// pages/admin/ManageMediaPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '../../types';
import { mediaService } from '../../services/mediaService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner';
import { PlusCircle, UploadCloud, PlayCircle } from 'lucide-react';

const ManageMediaPage = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const items = await mediaService.getAllMedia();
      setMediaItems(items);
    } catch (error) {
      addToast('Failed to load media.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadService.uploadFile(file);
      addToast('Media uploaded successfully!', 'success');
      fetchMedia(); // Refresh the media list
    } catch (error) {
      addToast('Media upload failed.', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Media Library</h1>
        <button 
          onClick={triggerFileUpload} 
          disabled={isUploading}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-800 transition disabled:bg-gray-400"
        >
          {isUploading ? <><UploadCloud size={20} className="mr-2 animate-pulse" /> Uploading...</> : <><PlusCircle size={20} className="mr-2" /> Upload New</>}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
        />
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.length > 0 ? mediaItems.map(item => (
              <div key={item.id} className="relative aspect-square group bg-gray-100 rounded-md">
                 {item.mediaType === 'video' ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle size={32} className="text-white/80" />
                    </div>
                  </>
                ) : (
                  <img 
                    src={item.url} 
                    alt={item.fileName} 
                    className="w-full h-full object-cover rounded-md" 
                  />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 rounded-md">
                  <p className="text-white text-xs truncate" title={item.fileName}>{item.fileName}</p>
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center text-gray-500 py-10">No media items found. Upload one to get started!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMediaPage;