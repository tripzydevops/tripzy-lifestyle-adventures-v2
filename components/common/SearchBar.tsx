import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { trackSignal } from "../../services/signalService";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Track Search Signal (Layer 1)
      trackSignal({
        signalType: "search",
        metadata: { query: query.trim() },
      });

      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts..."
        className="border-gray-300 rounded-full pl-10 pr-4 py-1 text-sm focus:ring-primary focus:border-primary border"
      />
      <button
        type="submit"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        aria-label="Search"
      >
        <Search size={18} />
      </button>
    </form>
  );
};

export default SearchBar;
