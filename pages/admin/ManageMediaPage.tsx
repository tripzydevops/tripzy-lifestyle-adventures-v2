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
  Upload,
  Filter,
  Tag,
  Copy,
  Check,
  Search,
  Grid,
  List,
} from "lucide-react";

const ManageMediaPage = () => {
  const { t } = useLanguage();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        await uploadService.uploadFile(fileArray[i]);
      }
      addToast(
        t("admin.media.uploadSuccess").replace(
          "{count}",
          files.length.toString()
        ),
        "success"
      );
      fetchMedia();
    } catch (error) {
      addToast(t("admin.media.uploadFailed"), "error");
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast(t("admin.media.urlCopied"), "success");
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

  const allTags = Array.from(
    new Set(mediaItems.flatMap((m) => m.tags || []))
  ).sort();

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter = filter === "all" || item.mediaType === filter;
    const matchesTag = !selectedTag || item.tags?.includes(selectedTag);

    return matchesSearch && matchesFilter && matchesTag;
  });

  return (
    <div
      className={`animate-in fade-in duration-500 pb-20 ${
        isDragging ? "opacity-50" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Bulk Upload Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gold/10 backdrop-blur-md border-4 border-dashed border-gold pointer-events-none">
          <div className="text-gold flex flex-col items-center">
            <Upload size={64} className="mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold font-serif">
              {t("admin.media.dropToUpload")}
            </h2>
            <p className="text-gold/80 font-bold">
              {t("admin.media.imagesAndVideos")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <ImageIcon className="text-gold" />
            {t("admin.media.manageMedia")}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("admin.media.mediaSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isUploading && (
            <div className="flex items-center gap-2 bg-navy-900 border border-gold/30 px-4 py-2 rounded-xl text-gold animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t("admin.media.uploading")} {uploadProgress.current}/
                {uploadProgress.total}
              </span>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-gold text-navy-950 px-6 py-3 rounded-xl font-bold flex items-center hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <PlusCircle size={20} className="mr-2" />
            {t("admin.media.newMedia")}
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files!)}
          className="hidden"
          accept="image/*,video/*"
          multiple
        />
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder={t("admin.media.searchMedia")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-900/50 backdrop-blur-sm border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-navy-950/50 p-1 rounded-2xl border border-white/5">
            {(["all", "image", "video"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                  filter === type
                    ? "bg-gold text-navy-950 shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t(`admin.media.types.${type}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-navy-950/50 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Tags Quick Filter */}
        {allTags.length > 0 && (
          <div className="lg:col-span-12 flex flex-wrap gap-2 items-center px-2">
            <Tag size={16} className="text-gold mr-2" />
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                !selectedTag
                  ? "bg-gold text-navy-950"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {t("admin.media.allTags")}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedTag === tag
                    ? "bg-gold text-navy-950"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-8 min-h-[400px]">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : filteredItems.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square bg-navy-950 border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5"
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
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-navy-950/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-4 flex flex-col justify-between">
                    <div>
                      <p
                        className="text-[10px] text-white font-bold truncate tracking-tight mb-2"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded uppercase tracking-widest leading-none"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyUrl(item.url, item.id)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-gold hover:text-navy-950 transition-all"
                          title={t("admin.media.copyUrl")}
                        >
                          {copiedId === item.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                          title={t("admin.media.openOriginal")}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-red-500/10 text-red-500/60 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        title={t("admin.media.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest pl-4">
                      {t("admin.media.preview")}
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t("admin.media.filename")}
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t("admin.media.type")}
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t("admin.media.tags")}
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t("admin.media.size")}
                    </th>
                    <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right pr-4">
                      {t("admin.media.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.02]">
                      <td className="py-4 pl-4">
                        <div className="w-12 h-12 bg-navy-950 rounded-lg overflow-hidden border border-white/5">
                          {item.mediaType === "video" ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <PlayCircle size={20} />
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-bold text-white truncate max-w-xs">
                          {item.fileName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">
                          {item.url.substring(0, 30)}...
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            item.mediaType === "video"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {item.mediaType}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] border border-white/5 bg-navy-950 text-gray-400 px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-gray-500">
                        {item.sizeBytes
                          ? `${(item.sizeBytes / 1024).toFixed(0)} KB`
                          : "N/A"}
                      </td>
                      <td className="py-4 text-right pr-4 space-x-2">
                        <button
                          onClick={() => handleCopyUrl(item.url, item.id)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-gold hover:text-navy-950 transition-all"
                        >
                          {copiedId === item.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 bg-red-500/10 text-red-500/60 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-20 text-center">
            <div className="w-24 h-24 bg-navy-950 rounded-full flex items-center justify-center mx-auto mb-6 text-navy-800 border-2 border-dashed border-white/5">
              <Upload
                size={40}
                className={isDragging ? "animate-bounce text-gold" : ""}
              />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-2">
              {t("admin.media.noMediaFound")}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              {t("admin.media.dragDropText")}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gold font-bold hover:underline tracking-widest text-xs uppercase"
            >
              {t("admin.media.uploadFirst")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMediaPage;
