import React, { useState } from "react";
import {
  Search,
  Compass,
  MapPin,
  Feather,
  Heart,
  User,
  Coffee,
} from "lucide-react";

interface DiscoveryProps {
  onSearch: (term: string, vibes: string[]) => void;
  isSearching: boolean;
}

const DiscoveryHero: React.FC<DiscoveryProps> = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Suggested Prompts for "Agentic" feel
  const prompts = [
    "Find hidden cafes in Rome...",
    "Plan a 3-day budget trip to Tokyo...",
    "Where is good for solo hiking?",
    "Show me luxury retreats in Bali...",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate prompts every 3 seconds
  React.useEffect(() => {
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
    // Don't auto-search on vibe toggle, let user click "Go" or focus intent
    // OR: We could auto-filter Level 1 here.
    // Let's defer to main search for now.
    onSearch(searchTerm, newVibes);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(searchTerm, activeVibes);
    }
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-navy-950">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
          alt="Travel Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/20 via-navy-900/10 to-navy-950/90" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight">
          Where should your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-orange-400">
            next story
          </span>{" "}
          begin?
        </h1>

        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto hidden md:block">
          Describe your dream trip or pick a vibe. Our AI Agent curates the
          perfect journey for you.
        </p>

        {/* Search Bar Container */}
        <div
          className={`
            bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl transition-all duration-300
            ${
              isFocused
                ? "bg-white/20 border-gold-500/50 scale-105"
                : "hover:bg-white/15"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Search
              className={`w-6 h-6 ml-3 ${
                isFocused ? "text-gold-400" : "text-white/50"
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={prompts[placeholderIndex]}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-lg px-2 py-3 font-medium"
            />
            <button
              onClick={() => onSearch(searchTerm, activeVibes)}
              disabled={isSearching}
              className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-6 py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
        <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => toggleVibe(vibe.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200
                ${
                  activeVibes.includes(vibe.id)
                    ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-105"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                }
              `}
            >
              {vibe.icon}
              {vibe.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryHero;
