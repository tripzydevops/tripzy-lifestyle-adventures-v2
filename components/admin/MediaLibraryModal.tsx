// components/admin/MediaLibraryModal.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { MediaItem } from "../../types";
import { mediaService } from "../../services/mediaService";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import Spinner from "../common/Spinner";
import {
  X,
  CheckCircle,
  UploadCloud,
  PlayCircle,
  Loader2,
  Image as ImageIcon,
  Search,
} from "lucide-react";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaItem: MediaItem) => void;
}

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { t } = useLanguage();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const items = await mediaService.getAllMedia();
      setMediaItems(items);
    } catch (error) {
      addToast("Failed to load media.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadService.uploadFile(file);
      addToast("Media uploaded successfully!", "success");
      await fetchMedia();
    } catch (error) {
      addToast("Media upload failed.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const filteredItems = mediaItems.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-navy-900 border border-white/10 rounded-[32px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-white/5 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                Media Explorer
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Select or Upload assets
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 md:justify-end">
            <div className="relative w-full sm:max-w-[240px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-600"
                size={16}
              />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={triggerFileUpload}
                disabled={isUploading}
                className="bg-gold text-navy-950 px-5 py-2.5 text-sm rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold/10 transition-all active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} /> Upload
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-navy-800 text-gray-400 hover:text-white rounded-xl hover:bg-navy-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*"
          />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
              <Spinner />
              <p className="font-serif italic">Accessing travel archives...</p>
            </div>
          ) : (
            <div>
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      className="relative aspect-square group focus:outline-none rounded-2xl overflow-hidden bg-navy-800/30 border border-white/5 transition-all hover:border-gold/40 hover:scale-[1.02] shadow-xl hover:shadow-gold/5"
                      onClick={() => onSelect(item)}
                    >
                      {item.mediaType === "video" ? (
                        <div className="w-full h-full relative">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <PlayCircle
                              size={32}
                              className="text-white/80 transition-transform group-hover:scale-110"
                            />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.fileName}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 bg-gold rounded-full shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
                          <CheckCircle size={24} className="text-navy-950" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-navy-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white truncate font-bold uppercase tracking-widest">
                          {item.fileName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-20 h-20 bg-navy-800 rounded-3xl flex items-center justify-center mb-6 text-navy-600">
                    <ImageIcon size={40} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mb-2 italic">
                    Deserts were found...
                  </h3>
                  <p className="text-gray-500 max-w-xs">
                    {searchQuery
                      ? `No files matching "${searchQuery}" in your current expedition archives.`
                      : "Upload your first storytelling asset to begin."}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MediaLibraryModal;
