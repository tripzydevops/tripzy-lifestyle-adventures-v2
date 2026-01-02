import React, { useState } from "react";
import { TripzyClient } from "../lib/tripzy-sdk/TripzyClient";
import { SupabaseMemoryAdapter } from "../lib/tripzy-sdk/adapters/SupabaseAdapter";

const SDKTestPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!apiKey || !supabaseUrl || !supabaseKey) {
        throw new Error("Missing Environment Variables");
      }

      const memory = new SupabaseMemoryAdapter(supabaseUrl, supabaseKey);
      const sdk = new TripzyClient({
        apiKey,
        memoryAdapter: memory,
        debug: true,
      });

      const recommendation = await sdk.getRecommendations(query);
      setResults(recommendation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-navy-900">
        SDK Intelligence Test
      </h1>

      <div className="mb-8">
        <label className="block text-gray-700 font-medium mb-2">
          User Query / Context
        </label>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="e.g. 'I want a cyberpunk adventure in Tokyo'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze & Recommend"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="space-y-8 animate-fade-in">
          {/* Layer 2: Reasoning Output */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🧠</span> The Brain (Layer 2)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">
                  Intent
                </h3>
                <p className="text-lg">{results.intent}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">
                  Confidence
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: `${results.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-sm">
                    {(results.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="col-span-full">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">
                  Reasoning
                </h3>
                <p className="text-gray-700 italic border-l-4 border-primary-200 pl-4 py-1">
                  "{results.reasoning}"
                </p>
              </div>
              <div className="col-span-full">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">
                  Keywords Extracted
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.keywords?.map((k: string, i: number) => (
                    <span
                      key={i}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3: Memory/Content Output */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📚</span> The Memory (Layer 3)
            </h2>

            {results.content && results.content.length > 0 ? (
              <div className="grid gap-4">
                {results.content.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border p-4 rounded-lg hover:bg-gray-50 transition"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-primary-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 my-1">
                        {item.excerpt || item.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          Match: {(item.match_score * 100).toFixed(1)}%
                        </span>
                        <span>{item.category?.name || "Uncategorized"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                No relevant content found in memory for this context.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SDKTestPage;
