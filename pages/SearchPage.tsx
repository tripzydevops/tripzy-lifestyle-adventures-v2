import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import PostCard from "../components/common/PostCard";
import Spinner from "../components/common/Spinner";
import { Post } from "../types";
import { postService } from "../services/postService";
import { aiService } from "../services/aiService";
import SEO from "../components/common/SEO";
import Pagination from "../components/common/Pagination";
import {
  Sparkles,
  ExternalLink,
  Search as SearchIcon,
  BrainCircuit,
} from "lucide-react";
import { useLanguage } from "../localization/LanguageContext";
import { useSignalTracker } from "../hooks/useSignalTracker";
import {
  reasoningService,
  ReasonedRecommendation,
} from "../services/reasoningService";

const SearchPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackSearch } = useSignalTracker();

  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    text: string;
    sources: any[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [reasonedRec, setReasonedRec] = useState<ReasonedRecommendation | null>(
    null
  );
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setTotalPages(0);
      setAiSummary(null);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      const { posts: fetchedPosts, totalPages: fetchedTotalPages } =
        await postService.searchPosts(query, currentPage);
      setPosts(fetchedPosts);
      setTotalPages(fetchedTotalPages);
      setLoading(false);

      // Track search query and result count
      trackSearch(query, fetchedPosts.length);
    };

    const fetchAiSummary = async () => {
      setLoadingAi(true);
      const summary = await aiService.getSearchGrounding(query);
      setAiSummary(summary);
      setLoadingAi(false);
    };

    const fetchReasoning = async () => {
      setLoadingReasoning(true);
      const rec = await reasoningService.getRecommendation(query);
      setReasonedRec(rec);
      setLoadingReasoning(false);
    };

    fetchPosts();
    if (currentPage === 1) {
      fetchAiSummary();
      fetchReasoning();
    }
  }, [query, currentPage]);

  const handlePageChange = (page: number) => {
    navigate(`/search?q=${encodeURIComponent(query)}&page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-navy-950">
      <SEO title={`${t("common.search")}: ${query}`} />
      <Header />
      <main className="flex-grow">
        <section className="py-12 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-4 flex items-center justify-center gap-3">
                <SearchIcon className="text-gold" size={32} />
                {t("common.search")}
              </h1>
              {query && (
                <p className="text-xl text-gray-400">
                  {t("search.resultsFor")}{" "}
                  <span className="text-gold italic">"{query}"</span>
                </p>
              )}
            </div>

            {/* AI Grounding Section */}
            {query && currentPage === 1 && (
              <div className="max-w-4xl mx-auto mb-16">
                <div className="bg-navy-900/50 backdrop-blur-xl rounded-2xl border border-gold/10 overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-navy-800/20">
                    <div className="flex items-center gap-2 text-gold font-bold tracking-wide uppercase text-sm">
                      <Sparkles size={18} />
                      <span>{t("search.aiOverview")}</span>
                    </div>
                    {loadingAi && (
                      <div className="animate-spin h-4 w-4 border-2 border-gold border-t-transparent rounded-full"></div>
                    )}
                  </div>

                  <div className="p-8">
                    {loadingAi ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse"></div>
                        <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse"></div>
                      </div>
                    ) : aiSummary ? (
                      <div>
                        <p className="text-lg text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                          {aiSummary.text}
                        </p>
                        {aiSummary.sources.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                              Verified Sources
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {aiSummary.sources.map(
                                (chunk: any, i: number) =>
                                  chunk.web && (
                                    <a
                                      key={i}
                                      href={chunk.web.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs bg-navy-800/80 hover:bg-gold hover:text-navy-950 text-gray-400 px-3 py-1.5 rounded-lg border border-white/5 transition-all duration-300"
                                    >
                                      <span className="font-bold truncate max-w-[150px]">
                                        {chunk.web.title || "Source"}
                                      </span>
                                      <ExternalLink size={10} />
                                    </a>
                                  )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-center py-4">
                        {t("search.aiOverviewError")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tripzy Autonomous Reasoning Section */}
            {query &&
              currentPage === 1 &&
              (reasonedRec || loadingReasoning) && (
                <div className="max-w-4xl mx-auto mb-16 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-blue-500/20 rounded-3xl blur opacity-30"></div>
                  <div className="relative bg-navy-950/80 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
                      {/* Left: The Recommendation */}
                      <div className="flex-1 p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-gold/10 p-2 rounded-xl">
                            <BrainCircuit className="text-gold" size={24} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg leading-tight font-serif">
                              Tripzy Autonomous Engine
                            </h3>
                            <div className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">
                              Personalized Reasoning
                            </div>
                          </div>
                          {loadingReasoning && (
                            <div className="ml-auto animate-pulse flex gap-1">
                              <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-gold rounded-full delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-gold rounded-full delay-150"></div>
                            </div>
                          )}
                        </div>

                        {loadingReasoning ? (
                          <div className="space-y-4">
                            <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-white/5 rounded w-1/2 animate-pulse mt-4"></div>
                          </div>
                        ) : (
                          reasonedRec && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                              <h4 className="text-2xl font-bold text-white mb-4 leading-snug">
                                {reasonedRec.content}
                              </h4>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Confidence:{" "}
                                    {Math.round(reasonedRec.confidence * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Right: The Reasoning (The "Why") */}
                      <div className="flex-1 p-8 bg-white/[0.02]">
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                          The "Why"
                        </h5>
                        {loadingReasoning ? (
                          <div className="space-y-3">
                            <div className="h-3 bg-white/5 rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-white/5 rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse"></div>
                          </div>
                        ) : (
                          reasonedRec && (
                            <div className="text-gray-400 text-sm leading-relaxed italic animate-in fade-in delay-300 duration-700">
                              "{reasonedRec.reasoning}"
                            </div>
                          )
                        )}
                        {!loadingReasoning && reasonedRec && (
                          <div className="mt-8">
                            <p className="text-[10px] text-gray-600 uppercase tracking-tight font-bold">
                              Verified by Tripzy Autonomous Agent v2.1
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  {t("search.blogResults")}
                  <span className="text-gold text-lg font-sans">
                    ({posts.length})
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <Spinner size="large" />
                </div>
              ) : posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div className="text-center py-24 bg-navy-900/30 rounded-3xl border border-dashed border-white/10">
                  <div className="mb-4 flex justify-center text-gray-600">
                    <SearchIcon size={48} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">
                    {t("search.noResults")}
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {t("search.noResultsSub")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
