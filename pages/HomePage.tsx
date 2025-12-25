import React, { useState, useEffect } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import PostCard from "../components/common/PostCard";
import Spinner from "../components/common/Spinner";
import { Post } from "../types";
import { postService } from "../services/postService";
import SEO from "../components/common/SEO";
import Pagination from "../components/common/Pagination";
import { Play, ArrowRight, Sparkles, MapPin, ExternalLink } from "lucide-react";

const TRIPZY_APP_URL =
  import.meta.env.VITE_TRIPZY_APP_URL || "https://tripzy.travel";

// Featured YouTube videos (would come from Supabase later)
const FEATURED_VIDEOS = [
  {
    id: "1",
    youtubeId: "dQw4w9WgXcQ", // Replace with real video IDs
    title: "Hidden Gems of Cappadocia",
    thumbnail: "https://picsum.photos/seed/cappadocia/640/360",
  },
  {
    id: "2",
    youtubeId: "dQw4w9WgXcQ",
    title: "Street Food Tour: Istanbul",
    thumbnail: "https://picsum.photos/seed/istanbul/640/360",
  },
  {
    id: "3",
    youtubeId: "dQw4w9WgXcQ",
    title: "Budget Travel: Turkish Riviera",
    thumbnail: "https://picsum.photos/seed/riviera/640/360",
  },
];

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { posts: fetchedPosts, totalPages: fetchedTotalPages } =
        await postService.getPublishedPosts(currentPage);
      setPosts(fetchedPosts);
      setTotalPages(fetchedTotalPages);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    fetchPosts();
  }, [currentPage]);

  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO />
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://picsum.photos/seed/tripzy-hero/1920/1080')`,
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-navy-950/60 to-navy-900" />

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">
                Your Travel Adventure Starts Here
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 animate-slide-up">
              <span className="text-white">Live Your </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-primary-light bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>

            <p
              className="text-xl md:text-2xl text-slate-300 font-light mb-8 max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Discover stories, tips, and guides from our travels across the
              globe.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <a
                href="#latest-stories"
                className="btn bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
              >
                Explore Stories
              </a>
              <a
                href={TRIPZY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all hover:-translate-y-1 flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Find Deals on Tripzy
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-gold rounded-full" />
            </div>
          </div>
        </section>

        {/* YouTube Videos Section */}
        <section className="py-20 bg-navy-950/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2">
                  <span className="text-gold">▶</span> Watch Our Adventures
                </h2>
                <p className="text-slate-400">
                  Travel vlogs, guides, and destination highlights
                </p>
              </div>
              <a
                href="https://youtube.com/@tripzytravel"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                View All Videos <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_VIDEOS.map((video, index) => (
                <div
                  key={video.id}
                  className="group relative rounded-2xl overflow-hidden bg-navy-800 border border-white/5 hover:border-gold/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-gold/10"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-navy-950/40 group-hover:bg-navy-950/20 transition-colors" />
                    <button className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play
                          className="w-6 h-6 text-navy-950 ml-1"
                          fill="currentColor"
                        />
                      </div>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-gold transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <a
                href="https://youtube.com/@tripzytravel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                View All Videos <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Latest Stories Section */}
        <section id="latest-stories" className="py-20 bg-navy-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4">
                Latest <span className="text-gold">Stories</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Dive into our latest travel experiences, tips, and destination
                guides
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      className="animate-fade-in"
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-navy-800 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gold" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Coming Soon
                </h3>
                <p className="text-slate-400 mb-8">
                  We're working on amazing travel stories. Check back soon!
                </p>
                <a
                  href={TRIPZY_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all"
                >
                  <MapPin className="w-5 h-5" />
                  Explore Deals on Tripzy
                </a>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section - Cross-link to Tripzy.travel */}
        <section className="py-20 bg-gradient-to-r from-navy-800 via-navy-900 to-navy-800 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-6">
                Ready to <span className="text-gold">Save</span> on Your Next
                Adventure?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Discover exclusive deals and discounts on experiences, dining,
                and activities with the Tripzy app.
              </p>
              <a
                href={TRIPZY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-gold/40 transition-all hover:-translate-y-1 animate-pulse-glow"
              >
                <MapPin className="w-6 h-6" />
                Explore Tripzy Deals
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
