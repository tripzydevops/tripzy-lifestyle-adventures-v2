import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Compass,
  MapPin,
  Feather,
  Heart,
  User,
  Coffee,
  ArrowDown,
} from "lucide-react";

interface DiscoveryProps {
  onSearch: (term: string, vibes: string[]) => void;
  isSearching: boolean;
}

const DiscoveryHero: React.FC<DiscoveryProps> = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Suggested Prompts for "Agentic" feel
  const prompts = [
    "Find hidden cafes in Rome...",
    "Plan a 3-day budget trip to Tokyo...",
    "Where is good for solo hiking?",
    "Show me luxury retreats in Bali...",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Parallax & Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotate prompts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % prompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const vibes = [
    { id: "nature", label: "Nature", icon: <Feather className="w-4 h-4" /> },
    { id: "city", label: "City", icon: <MapPin className="w-4 h-4" /> },
    { id: "luxury", label: "Luxury", icon: <Compass className="w-4 h-4" /> },
    { id: "budget", label: "Budget", icon: <Coffee className="w-4 h-4" /> },
    { id: "romantic", label: "Romantic", icon: <Heart className="w-4 h-4" /> },
    { id: "solo", label: "Solo", icon: <User className="w-4 h-4" /> },
  ];

  const toggleVibe = (id: string) => {
    const newVibes = activeVibes.includes(id)
      ? activeVibes.filter((v) => v !== id)
      : [...activeVibes, id];
    setActiveVibes(newVibes);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(searchTerm, activeVibes);
    }
  };

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight - 80, behavior: "smooth" });
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-navy-950">
      {/* 1. Cinematic Background Layer (Parallax) */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-flying-over-the-coast-of-italy-5346/1080p.mp4"
            type="video/mp4"
          />
        </video>
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-navy-900/10 to-navy-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/50 via-transparent to-navy-950/50" />

        {/* Ambient Noise */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 2. Content Container */}
      <div
        className="relative z-10 container mx-auto px-4 text-center max-w-5xl flex flex-col items-center"
        style={{
          opacity: 1 - scrollY / 700,
          transform: `translateY(${scrollY * 0.2}px) scale(${1 - scrollY / 2000})`,
        }}
      >
        {/* Floating Badge */}
        <div className="mb-8 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-gold text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <Compass size={12} />
            AI-Powered Exploration
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-2xl animate-fade-in-up delay-100">
          Where will your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-shimmer bg-[length:200%_auto]">
            story begin?
          </span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up delay-200">
          Describe your dream trip or pick a vibe. Our AI Agent curates the
          perfect journey uniquely for you.
        </p>

        {/* Search Bar Container */}
        <div
          className={`
            w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-2xl transition-all duration-300 animate-fade-in-up delay-300
            ${
              isFocused
                ? "bg-white/10 border-gold/50 shadow-[0_0_30px_rgba(255,215,0,0.15)] scale-105"
                : "hover:bg-white/10"
            }
          `}
        >
          <div className="flex items-center gap-2 pl-4">
            <Search
              className={`w-6 h-6 ${isFocused ? "text-gold" : "text-white/50"}`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={prompts[placeholderIndex]}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-lg px-2 py-3 font-medium"
            />
            <button
              onClick={() => onSearch(searchTerm, activeVibes)}
              disabled={isSearching}
              className="bg-gold hover:bg-gold-light text-navy-950 font-bold px-8 py-4 rounded-full transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                  Thinking...
                </span>
              ) : (
                "Explore"
              )}
            </button>
          </div>
        </div>

        {/* Vibe Selectors */}
        <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in-up delay-500">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => toggleVibe(vibe.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300
                ${
                  activeVibes.includes(vibe.id)
                    ? "bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-105"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white"
                }
              `}
            >
              {vibe.icon}
              {vibe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/30 hover:text-gold transition-colors animate-bounce cursor-pointer group"
        aria-label="Scroll down"
      >
        <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Scroll
        </span>
        <ArrowDown size={24} />
      </button>
    </div>
  );
};

export default DiscoveryHero;
