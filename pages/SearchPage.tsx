
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PostCard from '../components/common/PostCard';
import Spinner from '../components/common/Spinner';
import { Post } from '../types';
import { postService } from '../services/postService';
import { aiService } from '../services/aiService';
import SEO from '../components/common/SEO';
import Pagination from '../components/common/Pagination';
import { Sparkles, ExternalLink } from 'lucide-react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ text: string; sources: any[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setTotalPages(0);
      setAiSummary(null);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      const { posts: fetchedPosts, totalPages: fetchedTotalPages } = await postService.searchPosts(query, currentPage);
      setPosts(fetchedPosts);
      setTotalPages(fetchedTotalPages);
      setLoading(false);
    };

    const fetchAiSummary = async () => {
      setLoadingAi(true);
      const summary = await aiService.getSearchGrounding(query);
      setAiSummary(summary);
      setLoadingAi(false);
    };
    
    fetchPosts();
    if (currentPage === 1) fetchAiSummary();
  }, [query, currentPage]);

  const handlePageChange = (page: number) => {
    navigate(`/search?q=${encodeURIComponent(query)}&page=${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO title={`Search results for "${query}"`} />
      <Header />
      <main className="flex-grow">
        <section className="py-12 bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center text-neutral mb-2">Search</h1>
            {query && (
                <p className="text-center text-gray-600 mb-8">
                    Results for: <span className="font-semibold text-primary">"{query}"</span>
                </p>
            )}

            {/* AI Grounding Section */}
            {query && (currentPage === 1) && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                  <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Sparkles size={18} />
                      <span>Gemini AI Overview</span>
                    </div>
                    {loadingAi && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                  </div>
                  <div className="p-6">
                    {loadingAi ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                      </div>
                    ) : aiSummary ? (
                      <div>
                        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{aiSummary.text}</p>
                        {aiSummary.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {aiSummary.sources.map((chunk: any, i: number) => (
                                chunk.web && (
                                  <a 
                                    key={i} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-primary px-2 py-1 rounded border transition"
                                  >
                                    {chunk.web.title || 'Source'} <ExternalLink size={10} />
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Could not generate AI overview for this query.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="max-w-7xl mx-auto">
              <h2 className="text-xl font-bold text-neutral mb-6 flex items-center gap-2">
                {loading ? 'Searching...' : `Blog Results (${posts.length})`}
              </h2>
              
              {loading ? (
                <Spinner />
              ) : posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
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
                  <div className="text-center text-gray-500 py-16 bg-white rounded-xl shadow-sm border border-dashed">
                      <h3 className="text-2xl font-semibold">No blog posts found.</h3>
                      <p className="mt-2">Try searching for keywords like "Italy", "Kyoto", or "Adventure".</p>
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
