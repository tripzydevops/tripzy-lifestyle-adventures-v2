// pages/admin/ManageMediaPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { MediaItem } from "../../types";
import { mediaService } from "../../services/mediaService";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import Spinner from "../../components/common/Spinner";
import {
  PlusCircle,
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";

const ManageMediaPage = () => {
  const { t } = useLanguage();
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
      addToast(t("admin.loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadService.uploadFile(file);
      addToast(t("admin.uploadSuccess"), "success");
      fetchMedia();
    } catch (error) {
      addToast(t("admin.uploadError"), "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;

    try {
      await uploadService.deleteFile(item.id, item.url);
      addToast(t("admin.deleteSuccess"), "success");
      fetchMedia();
    } catch (error) {
      addToast(t("common.error"), "error");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <ImageIcon className="text-gold" />
            {t("admin.manageMedia")}
          </h1>
          <p className="text-gray-400 text-sm">{t("admin.mediaSubtitle")}</p>
        </div>

        <button
          onClick={triggerFileUpload}
          disabled={isUploading}
          className="bg-gold text-navy-950 px-6 py-3 rounded-xl font-bold flex items-center hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="mr-2 animate-spin" />{" "}
              {t("admin.uploading")}
            </>
          ) : (
            <>
              <PlusCircle size={20} className="mr-2" /> {t("admin.newMedia")}
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
        />
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-8">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square bg-navy-800/50 rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5"
                  >
                    {item.mediaType === "video" ? (
                      <div className="w-full h-full relative">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <PlayCircle size={32} className="text-white/80" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-navy-950/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-4 flex flex-col justify-between">
                      <p
                        className="text-[10px] text-white font-bold truncate tracking-tight"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </p>

                      <div className="flex justify-between items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/10 rounded-lg hover:bg-gold hover:text-navy-950 transition-all"
                          title="Open Original"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Library Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-navy-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-navy-600">
                  <ImageIcon size={40} />
                </div>
                <p className="text-gray-500 font-serif text-lg">
                  {t("admin.noMedia")}
                </p>
                <button
                  onClick={triggerFileUpload}
                  className="text-gold font-bold mt-2 hover:underline"
                >
                  {t("admin.uploadFirst")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMediaPage;
