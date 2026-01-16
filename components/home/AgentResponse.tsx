import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Brain,
  Loader2,
} from "lucide-react";

interface AgentResponseProps {
  streamState: {
    status: string;
    analysis: any;
    visuals: any[];
    text: string;
    posts: any[];
    isDone: boolean;
    consensus?: any;
  };
}

const AgentResponse: React.FC<AgentResponseProps> = ({ streamState }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamState.text]);

  if (!streamState.status && !streamState.text) return null;

  return (
    <div className="w-full max-w-4xl mx-auto my-8 space-y-6">
      {/* 1. Status Bar / Brain Activity */}
      <div className="flex items-center gap-3 bg-navy-800/50 p-4 rounded-xl border border-white/10 animate-fade-in">
        {streamState.isDone ? (
          <div className="bg-green-500/20 p-2 rounded-full">
            <Sparkles className="w-5 h-5 text-green-400" />
          </div>
        ) : (
          <div className="bg-gold/20 p-2 rounded-full animate-pulse">
            <Brain className="w-5 h-5 text-gold" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-white font-medium text-sm">
            {streamState.isDone
              ? "Recommendation Ready"
              : streamState.status || "Agent Active"}
          </p>
          {streamState.analysis?.lifestyleVibe && (
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                Vibe: {streamState.analysis.lifestyleVibe}
              </span>
              {streamState.analysis.constraints?.map((c: string) => (
                <span
                  key={c}
                  className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        {!streamState.isDone && (
          <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
        )}
      </div>

      {/* 2. Visual Gallery (If Found) */}
      {streamState.visuals.length > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2 text-gold-300 text-sm font-bold uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" /> Visual Inspiration
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {streamState.visuals.map((visual) => (
              <div
                key={visual.id}
                className="snap-center shrink-0 w-64 aspect-video rounded-lg overflow-hidden relative group border border-white/10 bg-navy-900"
              >
                <img
                  src={visual.public_url || visual.file_path} // Support public_url from media_library
                  alt={visual.alt_text}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">
                    {visual.alt_text || "Visual Match"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2.5 Consensus Judge (UI Transparency) */}
      {streamState.consensus && (
        <div className="animate-fade-in-up bg-gold/5 border border-gold/20 rounded-xl p-4 flex gap-4">
          <div className="bg-gold/10 p-2 rounded-lg h-fit">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gold text-xs font-bold uppercase tracking-widest">
                Consensus Judge
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  streamState.consensus.consensus_score > 0.7
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                Score: {Math.round(streamState.consensus.consensus_score * 100)}
                %
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "{streamState.consensus.critique}"
            </p>
          </div>
        </div>
      )}

      {/* 3. The Recommendation (Text Stream) */}
      {streamState.text && (
        <div className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gold/50" />
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-wrap font-serif text-slate-200">
              {streamState.text}
              {!streamState.isDone && (
                <span className="inline-block w-2 h-4 bg-gold ml-1 animate-pulse" />
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentResponse;
