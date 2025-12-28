import React, { useState } from "react";
import { mediaService } from "../../services/mediaService";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import {
  Link2,
  Loader2,
  PlayCircle,
  PlusCircle,
  ExternalLink,
  Globe,
} from "lucide-react";
import { MediaItem } from "../../types";
import { aiContentService } from "../../services/aiContentService";
import { Sparkles, Wand2 } from "lucide-react";

const ImportMediaPage = () => {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedItem, setImportedItem] = useState<MediaItem | null>(null);
  const { addToast } = useToast();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      addToast("Please enter a valid URL.", "error");
      return;
    }

    setIsImporting(true);
    setImportedItem(null);
    try {
      const newItem = await mediaService.importMediaFromUrl(url);

      // AI Enhancement
      if (newItem.type === "image") {
        addToast("Tripzy AI is analyzing your image...", "info");
        try {
          const analysis = await aiContentService.analyzeImageFromUrl(url);
          // Suggest updates to the media item (in this simple version we just update local state)
          newItem.altText = analysis.altText;
          newItem.caption = analysis.caption;
          // Optionally update in DB
          await mediaService.updateMedia(newItem.id, {
            altText: analysis.altText,
            caption: analysis.caption,
          });
          addToast("AI metadata generated!", "success");
        } catch (aiErr) {
          console.error("AI Analysis failed:", aiErr);
        }
      }

      setImportedItem(newItem);
      addToast("Media imported successfully!", "success");
      setUrl("");
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message, "error");
      } else {
        addToast("Failed to import media.", "error");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="text-gold" />
            {t("admin.importMedia") || "External Import"}
          </h1>
          <p className="text-gray-400 text-sm">
            Fetch media directly from external travel sources and CDNs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>

          <p className="text-gray-300 mb-8 relative z-10 leading-relaxed font-light">
            Paste the direct URL of an image or video to bridge it into your
            Tripzy media library.
          </p>

          <form onSubmit={handleImport} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label
                htmlFor="media-url"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                Resource URL
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-gold">
                  <Link2 size={18} />
                </div>
                <input
                  type="url"
                  id="media-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-navy-800/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700"
                  placeholder="https://images.unsplash.com/..."
                  required
                  disabled={isImporting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isImporting}
              className="w-full bg-gold text-navy-950 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Safely Bridging...
                </>
              ) : (
                <>
                  <PlusCircle size={20} />
                  Import to Library
                </>
              )}
            </button>
          </form>
        </div>

        {importedItem ? (
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-right duration-500">
            <h3 className="text-lg font-serif font-bold text-white mb-6 flex items-center gap-2">
              <PlusCircle size={20} className="text-green-400" />
              Resource Imported
            </h3>

            <div className="space-y-6">
              <div className="aspect-video bg-navy-800 rounded-2xl border border-white/5 overflow-hidden group relative">
                {importedItem.mediaType === "video" ? (
                  <video
                    src={importedItem.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={importedItem.url}
                    alt={importedItem.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute top-4 right-4 group-hover:translate-x-0 translate-x-12 opacity-0 group-hover:opacity-100 transition-all">
                  <a
                    href={importedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-navy-900/80 backdrop-blur-md rounded-xl text-gold border border-white/10 flex items-center gap-2 text-xs font-bold hover:bg-gold hover:text-navy-950"
                  >
                    <ExternalLink size={14} /> View Original
                  </a>
                </div>
              </div>

              <div className="p-4 bg-navy-800/40 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-white text-sm truncate pr-4">
                    {importedItem.fileName}
                  </p>
                  <span className="bg-gold/10 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border border-gold/20">
                    {importedItem.mediaType}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate font-mono">
                  {importedItem.url}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex h-full items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center">
            <div>
              <div className="w-20 h-20 bg-navy-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-navy-700">
                <Link2 size={40} />
              </div>
              <p className="text-gray-500 font-serif italic">
                Preview will appear here after a successful bridge.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportMediaPage;
