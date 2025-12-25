// components/admin/MediaLibraryModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '../../types';
import { mediaService } from '../../services/mediaService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../hooks/useToast';
import Spinner from '../common/Spinner';
import { X, CheckCircle, UploadCloud, PlayCircle } from 'lucide-react';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaItem: MediaItem) => void;
}

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadService.uploadFile(file);
      addToast('Media uploaded successfully!', 'success');
      await fetchMedia(); // Refresh the media list
    } catch (error) {
      addToast('Media upload failed.', 'error');
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-library-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b">
          <h2 id="media-library-title" className="text-xl font-bold text-gray-800">Media Library</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={triggerFileUpload} 
              disabled={isUploading}
              className="bg-primary text-white px-3 py-2 text-sm rounded-md flex items-center hover:bg-blue-800 transition disabled:bg-gray-400"
            >
              {isUploading ? <><UploadCloud size={18} className="mr-2 animate-pulse" /> Uploading...</> : <><UploadCloud size={18} className="mr-2" /> Upload</>}
            </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {mediaItems.length > 0 ? mediaItems.map(item => (
                <button 
                  key={item.id} 
                  className="relative aspect-square group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md bg-gray-100"
                  onClick={() => onSelect(item)}
                  title={`Select ${item.fileName}`}
                >
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                </button>
              )) : (
                <p className="col-span-full text-center text-gray-500 py-10">No media found. Upload one to get started.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MediaLibraryModal;