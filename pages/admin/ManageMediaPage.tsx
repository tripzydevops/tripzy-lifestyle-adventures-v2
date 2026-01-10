// pages/admin/ManageMediaPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { MediaItem } from "../../types";
import { mediaService } from "../../services/mediaService";
import { uploadService } from "../../services/uploadService";
import { aiContentService } from "../../services/aiContentService";
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
  Sparkles,
  Maximize2,
  Minimize2,
  Pencil,
  FileSignature, // For renaming
  Save, // For saving rename
  X,
} from "lucide-react";
import MediaEditorModal from "../../components/admin/MediaEditorModal";

const ManageMediaPage = () => {
  const { t } = useLanguage();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editor State
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Rename State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      // Use Paginated Fetch
      const { data, count } = await mediaService.getMedia(
        page,
        itemsPerPage,
        searchQuery,
        filter
      );
      setMediaItems(data);
      setTotalItems(count);
    } catch (error) {
      addToast(t("admin.loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t, page, itemsPerPage, searchQuery, filter]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalItems / itemsPerPage)) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const handleStartRename = (item: MediaItem) => {
    setRenamingId(item.id);
    setRenameValue(item.fileName);
  };

  const handleSaveRename = async (id: string) => {
    if (!renameValue.trim()) return;

    try {
      await mediaService.updateMedia(id, { fileName: renameValue });
      setRenamingId(null);
      setRenameValue("");
      addToast(t("admin.saveSuccess"), "success");
      fetchMedia(); // Refresh list to show new name (and re-sort/filter if needed)
    } catch (error) {
      addToast(t("admin.media.updateError"), "error");
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleEditMedia = (item: MediaItem) => {
    if (item.mediaType !== "image") {
      addToast("Only images can be edited.", "info");
      return;
    }
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleSaveEditedImage = async (file: File, mode: "replace" | "new") => {
    if (!editingItem) return;

    try {
      let newUrl = "";
      let newSize = file.size;

      if (mode === "replace") {
        // Extract original filename from URL or use the one in DB
        // For Supabase storage, the URL usually ends with the filename.
        // We want to overwrite the EXACT file path.
        // We can extract it from the existing URL.
        const urlParts = editingItem.url.split("/");
        const originalFileName = urlParts[urlParts.length - 1].split("?")[0];

        // Upload with Overwrite
        const result = await uploadService.uploadToStorage(file, {
          customFileName: originalFileName,
          upsert: true,
        });

        newUrl = result.url;
        newSize = result.size;

        // Add a timestamp to force UI refresh (cache busting)
        // We update the DB with the same base URL (or clean one) but local state might need help
        // actually, let's keep the DB URL clean.

        await mediaService.updateMedia(editingItem.id, {
          sizeBytes: newSize,
          fileName: file.name, // Update the display name in DB
          // We don't strictly *need* to update URL if it's identical,
          // but sending it again doesn't hurt.
        });

        addToast(
          "Image replaced successfully (Cache may take a moment to clear)",
          "success"
        );
      } else {
        // SAVE AS NEW
        const result = await uploadService.uploadToStorage(file);
        newUrl = result.url;
        newSize = result.size;

        await mediaService.addMedia({
          url: newUrl,
          fileName: file.name,
          mediaType: "image",
          sizeBytes: newSize,
          // Copy metadata from original to keep context
          tags: editingItem.tags,
          caption: editingItem.caption,
          altText: editingItem.altText,
        });
        addToast("Image saved as copy successfully", "success");
      }

      fetchMedia();
      setIsEditorOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to save edited image", error);
      addToast("Failed to save changes", "error");
    }
  };

  // Helper to wait for image to generate
  // Helper to wait for image to generate using standard Image loading
  // This avoids CORS preflight issues with fetch HEAD requests
  const waitForImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      // We set crossOrigin to anonymous to try and check CORS compliance early
      // but even if it fails, we know "something" is there (or blocked).
      img.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        resolve(false); // Timeout
      }, 15000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        // If it's a 404, it fails. If it's CORS, it also fails.
        // We will assume "false" means "cannot use internal upload".
        resolve(false);
      };

      img.src = url;
    });
  };

  const handleReanalyze = async (item: MediaItem) => {
    try {
      addToast(t("admin.media.analyzing"), "info");

      const expectedConcept = item.fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ");

      // 2. Verify Relevance
      console.log("[ManageMedia] Verifying relevance for:", item.url);
      const verification = await aiContentService.verifyImageRelevance(
        item.url,
        expectedConcept
      );

      console.log("[ManageMedia] Verification result:", verification);

      if (!verification.isRelevant) {
        addToast(
          `Mismatch detected! Image seems to be '${verification.detectedConcept}' instead of '${expectedConcept}'. Fixing...`,
          "info"
        );

        try {
          // 3. Generate Replacement
          // We add 'highly detailed' and '4k' to ensure quality
          const newImageUrl = await aiContentService.generateImage(
            `${expectedConcept} travel photography highly detailed 4k`
          );
          await waitForImage(newImageUrl);

          let uploadedUrl = newImageUrl;
          let newSize = 0;

          // Try to upload to internal storage
          try {
            // Use our new internal proxy to route the request server-side
            // This completely bypasses browser CORS restrictions
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(
              newImageUrl
            )}`;

            const imgRes = await fetch(proxyUrl);
            if (!imgRes.ok) throw new Error("Proxy fetch failed");

            const imgBlob = await imgRes.blob();
            const newFile = new File([imgBlob], item.fileName, {
              type: "image/jpeg",
            });

            // VALIDATION: Ensure the NEW image is not also a placeholder
            if (newFile.size < 5000) {
              console.warn(
                "Primary generation failed (too small). Attempting fallback..."
              );

              // RETRY LOGIC: Try the simpler fallback model
              const fallbackUrl = await aiContentService.generateFallbackImage(
                expectedConcept
              );
              const proxyFallback = `/api/proxy-image?url=${encodeURIComponent(
                fallbackUrl
              )}`;

              const fbRes = await fetch(proxyFallback);
              if (!fbRes.ok) throw new Error("Fallback generation failed");

              const fbBlob = await fbRes.blob();
              if (fbBlob.size < 5000) {
                throw new Error("Fallback image also too small. Aborting.");
              }

              // If fallback succeeded, use IT.
              uploadedUrl = await uploadService.uploadFile(
                new File([fbBlob], item.fileName, { type: "image/jpeg" })
              );
              newSize = fbBlob.size;
            } else {
              // Primary succeeded
              uploadedUrl = await uploadService.uploadFile(newFile);
              newSize = newFile.size;
            }
          } catch (fetchErr: any) {
            // If the error was our size check (and fallback failed), we must NOT fallback to external URL.
            if (fetchErr.message && fetchErr.message.includes("too small")) {
              console.error("AI Generation failed:", fetchErr);
              addToast(
                "Could not generate a valid image. Please try again later.",
                "error"
              );
              return; // STOP HERE. Do not save.
            }

            console.warn(
              "CORS or Fetch error downloading generated image. Using direct URL.",
              fetchErr
            );
            // Fallback: Use the direct Pollinations URL
            // This is safe because uploadService.deleteFile handles external URLs gracefully.
          }

          // Update DB with NEW URL (Internal or External)
          await mediaService.updateMedia(item.id, {
            url: uploadedUrl,
            sizeBytes: newSize || undefined,
            caption: `AI Auto-Corrected: ${expectedConcept}`,
            tags: ["ai-corrected", ...verification.detectedConcept.split(" ")],
          });

          addToast("Image auto-corrected successfully!", "success");
          fetchMedia();
          return; // Exit, we are done
        } catch (genError) {
          console.error("Auto-fix failed:", genError);
          addToast(
            `Could not auto-fix image for '${expectedConcept}'. Please check manually.`,
            "error"
          );
          return;
        }
      }

      // Normal Flow
      const analysis = await aiContentService.analyzeImageFromUrl(item.url);

      await mediaService.updateMedia(item.id, {
        altText: analysis.altText,
        caption: analysis.caption,
        tags: analysis.tags || [],
        fileName:
          (analysis.title || analysis.caption.slice(0, 30)).replace(
            /[^a-zA-Z0-9]/g,
            "_"
          ) + ".webp",
      });

      addToast(t("admin.media.analysisComplete"), "success");
      fetchMedia();
    } catch (error) {
      console.error("Re-analyze error:", error);
      addToast(t("admin.media.analysisFailed"), "error");
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

          <div className="flex items-center gap-2 bg-navy-950/50 p-1 rounded-2xl border border-white/5 ml-2">
            <button
              onClick={() =>
                setObjectFit(objectFit === "cover" ? "contain" : "cover")
              }
              className="p-2 rounded-xl transition-all text-gray-500 hover:text-white"
              title={
                objectFit === "cover"
                  ? t("admin.media.fitContain")
                  : t("admin.media.fitCover")
              }
            >
              {objectFit === "cover" ? (
                <Minimize2 size={20} />
              ) : (
                <Maximize2 size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Tags Quick Filter - LIMITED TO TOP 20 */}
        {allTags.length > 0 && (
          <div className="lg:col-span-12 flex flex-col gap-2">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 mb-1">
              {t("admin.media.popularTags")}
            </h4>
            <div className="flex flex-wrap gap-2 items-center px-1">
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

              {/* Calculate Top Tags Logic - Inline for now or moved to memo */}
              {(() => {
                const tagCounts: { [key: string]: number } = {};
                mediaItems.forEach((item) => {
                  item.tags?.forEach((tag) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                  });
                });

                return Object.entries(tagCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20) // Show top 20 only
                  .map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                        selectedTag === tag
                          ? "bg-gold text-navy-950"
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tag}{" "}
                      <span className="opacity-50 text-[8px]">({count})</span>
                    </button>
                  ));
              })()}
            </div>
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
                      className={`w-full h-full ${
                        objectFit === "cover"
                          ? "object-cover"
                          : "object-contain bg-black/50"
                      } transition-transform duration-700 group-hover:scale-105`}
                    />
                  )}

                  {/* Move Delete Button to Top Right for Visibility */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="absolute top-2 right-2 text-white/40 hover:text-red-500 bg-black/50 hover:bg-black/80 rounded-full p-2 translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-20"
                    title={t("admin.media.delete")}
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-navy-950/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-4 flex flex-col justify-between">
                    <div>
                      {renamingId === item.id ? (
                        <div className="flex items-center gap-1 mb-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none focus:border-gold"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={() => handleSaveRename(item.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Save size={12} />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start mb-2 group/title">
                          <p
                            className="text-[10px] text-white font-bold truncate tracking-tight flex-1"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(item);
                            }}
                            className="text-gray-400 hover:text-gold transition-colors ml-2 p-1"
                            title={t("admin.media.rename")}
                          >
                            <FileSignature size={14} />
                          </button>
                        </div>
                      )}
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

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <div className="flex gap-2 w-full justify-center">
                        <button
                          onClick={() => handleCopyUrl(item.url, item.id)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-gold hover:text-navy-950 transition-all flex-1 flex justify-center"
                          title={t("admin.media.copyUrl")}
                        >
                          {copiedId === item.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleReanalyze(item)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all flex-1 flex justify-center"
                          title={t("admin.media.reanalyze")}
                        >
                          <Sparkles size={14} />
                        </button>
                        {item.mediaType === "image" && (
                          <button
                            onClick={() => handleEditMedia(item)}
                            className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-gold hover:text-navy-950 transition-all flex-1 flex justify-center"
                            title={t("admin.media.edit")}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all flex-1 flex justify-center"
                          title={t("admin.media.openOriginal")}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
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
                        {renamingId === item.id ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="w-full bg-navy-900 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(item.id)}
                              className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500 hover:text-white"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="group/listitem flex items-center gap-2 max-w-xs">
                            <div className="text-sm font-bold text-white truncate">
                              {item.fileName}
                            </div>
                            <button
                              onClick={() => handleStartRename(item)}
                              className="p-1 text-gray-500 hover:text-gold opacity-0 group-hover/listitem:opacity-100 transition-opacity"
                              title={t("admin.media.rename")}
                            >
                              <FileSignature size={12} />
                            </button>
                          </div>
                        )}
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
                          onClick={() => handleReanalyze(item)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all"
                          title={t("admin.media.reanalyze")}
                        >
                          <Sparkles size={14} />
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

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing{" "}
            <span className="text-white font-bold">{mediaItems.length}</span> of{" "}
            <span className="text-white font-bold">{totalItems}</span> media
            items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold hover:text-navy-950 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({
                length: Math.min(5, Math.ceil(totalItems / itemsPerPage)),
              }).map((_, idx) => {
                let p = idx + 1;
                // Simple sliding window logic if needed, or just Basic 1,2,3
                // For now, let's keep it simple: Prev / Next + Current Page Display
                return null;
              })}
              <span className="text-gold font-bold bg-navy-950 px-3 py-1 rounded-lg border border-white/5">
                Page {page} of {Math.ceil(totalItems / itemsPerPage)}
              </span>
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalItems / itemsPerPage)}
              className="px-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold hover:text-navy-950 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <MediaEditorModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          imageUrl={editingItem?.url || ""}
          fileName={editingItem?.fileName}
          mimeType={editingItem?.mimeType}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );
};

export default ManageMediaPage;
