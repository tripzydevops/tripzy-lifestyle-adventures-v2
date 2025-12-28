import React from "react";
import { Sparkles, Globe, ClipboardList } from "lucide-react";

interface AIQuickActionsProps {
  onImprove: () => void;
  onTranslate: () => void;
  onOutline: () => void;
  isGenerating: boolean;
}

const AIQuickActions: React.FC<AIQuickActionsProps> = ({
  onImprove,
  onTranslate,
  onOutline,
  isGenerating,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-gold/20 via-blue-500/10 to-purple-500/10 h-1 rounded-t-3xl mx-4"></div>
      <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-b-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="block text-sm font-bold text-white tracking-tight">
                Gemini Intelligence
              </span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest">
                Autonomous Assistant
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onImprove}
              disabled={isGenerating}
              className="flex items-center gap-2 text-xs font-bold bg-navy-800 text-white px-5 py-2.5 rounded-xl hover:bg-navy-700 border border-white/5 transition-all shadow-lg group/btn active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles
                size={14}
                className="text-gold group-hover/btn:scale-110 transition-transform"
              />{" "}
              Improve Prose
            </button>
            <button
              type="button"
              onClick={onTranslate}
              disabled={isGenerating}
              className="flex items-center gap-2 text-xs font-bold bg-navy-800 text-white px-5 py-2.5 rounded-xl hover:bg-navy-700 border border-white/5 transition-all shadow-lg group/btn active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe
                size={14}
                className="text-blue-400 group-hover/btn:rotate-12 transition-transform"
              />{" "}
              Turkish Translate
            </button>
            <button
              type="button"
              onClick={onOutline}
              disabled={isGenerating}
              className="flex items-center gap-2 text-xs font-bold bg-navy-800 text-white px-5 py-2.5 rounded-xl hover:bg-navy-700 border border-white/5 transition-all shadow-lg group/btn active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClipboardList
                size={14}
                className="text-purple-400 group-hover/btn:scale-110 transition-transform"
              />{" "}
              Post Structure
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIQuickActions;
