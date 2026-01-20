import React, { useState, useEffect, useRef } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import PostCard from "../components/common/PostCard";
import Spinner from "../components/common/Spinner";
import { Post } from "../types";
import { postService } from "../services/postService";
import SEO from "../components/common/SEO";
import Pagination from "../components/common/Pagination";
import { Play, ArrowRight, Sparkles, MapPin, ExternalLink } from "lucide-react";
import {
  Play,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Globe,
  Brain,
  User,
  Scale,
  PenTool,
} from "lucide-react";
import { useLanguage } from "../localization/LanguageContext";
import { useTripzy } from "../hooks/useTripzy";

import DiscoveryHero from "../components/home/DiscoveryHero";
import SkeletonPostCard from "../components/common/SkeletonPostCard";

const TRIPZY_APP_URL =
  import.meta.env.VITE_TRIPZY_APP_URL || "https://tripzy.travel";

import { youtubeService, YoutubeVideo } from "../services/youtubeService";
import AgentResponse from "../components/home/AgentResponse";
import { AgentStep } from "../components/home/AgentChecklist";

const HomePage = () => {
  const { t } = useLanguage();
  const tripzy = useTripzy();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [aiIntent, setAiIntent] = useState<string | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("all");

  // Streaming State
  const [streamState, setStreamState] = useState<{
    status: string;
    analysis: any;
    visuals: any[];
    text: string;
    posts: any[];
    isDone: boolean;
    consensus: any;
    steps: AgentStep[];
  }>({
    status: "",
    analysis: null,
    visuals: [],
    text: "",
    posts: [],
    isDone: false,
    consensus: null,
    steps: [
      {
        id: "scout",
        label: "Scouting Global Trends",
        icon: <Globe className="w-4 h-4" />,
        status: "waiting",
      },
      {
        id: "memory",
        label: "Consulting Memory Bank",
        icon: <Brain className="w-4 h-4" />,
        status: "waiting",
      },
      {
        id: "profiler",
        label: "Analyzing Intent & Vibe",
        icon: <User className="w-4 h-4" />,
        status: "waiting",
      },
      {
        id: "judge",
        label: "Validating Authenticity",
        icon: <Scale className="w-4 h-4" />,
        status: "waiting",
      },
      {
        id: "writer",
        label: "Crafting Recommendation",
        icon: <PenTool className="w-4 h-4" />,
        status: "waiting",
      },
    ],
  });

  const isFirstRender = useRef(true);

  // Hybrid Search Logic
  const handleSearch = async (term: string, vibes: string[]) => {
    setIsSearching(true);
    // Don't set loading=true for posts yet, we want to show the Agent UI first
    window.scrollTo({ top: 500, behavior: "smooth" }); // Scroll to Agent area

    // Reset Stream
    setStreamState({
      status: "Connecting to Agent...",
      analysis: null,
      visuals: [],
      text: "",
      posts: [],
      isDone: false,
      consensus: null,
      steps: [
        {
          id: "scout",
          label: "Scouting Global Trends",
          icon: <Globe className="w-4 h-4" />,
          status: "waiting",
        },
        {
          id: "memory",
          label: "Consulting Memory Bank",
          icon: <Brain className="w-4 h-4" />,
          status: "waiting",
        },
        {
          id: "profiler",
          label: "Analyzing Intent & Vibe",
          icon: <User className="w-4 h-4" />,
          status: "waiting",
        },
        {
          id: "judge",
          label: "Validating Authenticity",
          icon: <Scale className="w-4 h-4" />,
          status: "waiting",
        },
        {
          id: "writer",
          label: "Crafting Recommendation",
          icon: <PenTool className="w-4 h-4" />,
          status: "waiting",
        },
      ],
    });

    try {
      // Level 2 & 3: AI Search (Streaming)
      if (tripzy && (term || vibes.length > 0)) {
        const vibeQuery =
          vibes.length > 0
            ? `I'm looking for a ${vibes.join(" and ")} experience.`
            : "";
        const fullQuery = `${vibeQuery} ${term}`.trim();

        await tripzy.streamRecommendation(fullQuery, [], (event) => {
          setStreamState((prev) => {
            const newState = { ...prev };

            switch (event.type) {
              case "status":
                newState.status = event.data;
                break;
              case "agent_start":
                newState.steps = newState.steps.map((s) =>
                  s.id === event.agent ? { ...s, status: "active" } : s,
                );
                break;
              case "agent_complete":
                newState.steps = newState.steps.map((s) =>
                  s.id === event.agent ? { ...s, status: "done" } : s,
                );
                break;
              case "analysis":
                newState.analysis = event.data;
                newState.steps = newState.steps.map((s) =>
                  s.id === "profiler" ? { ...s, status: "done" } : s,
                );
                // Also start the next logical step if needed? No, backend sends events.
                break;
              case "visuals":
                newState.visuals = event.data;
                break;
              case "consensus":
                newState.consensus = event.data;
                newState.steps = newState.steps.map((s) =>
                  s.id === "judge" ? { ...s, status: "done" } : s,
                );
                break;
              case "token":
                if (newState.text === "") {
                  // First token, writer is active
                  newState.steps = newState.steps.map((s) =>
                    s.id === "writer" ? { ...s, status: "active" } : s,
                  );
                }
                newState.text += event.data;
                break;
              case "posts":
                // Real-time update of the grid!
                setPosts(event.data);
                newState.posts = event.data;
                setTotalPages(1);
                break;
              case "done":
                newState.isDone = true;
                newState.status = "Complete";
                newState.steps = newState.steps.map((s) =>
                  s.id === "writer" ? { ...s, status: "done" } : s,
                );
                setIsSearching(false);
                break;
              case "error":
                newState.status = "Error: " + event.data;
                setIsSearching(false);
                break;
            }
            return newState;
          });
        });
      } else {
        // Fallback or empty search
        setLoading(true);
        const { posts: fetchedPosts, totalPages: fetchedTotalPages } =
          await postService.getPublishedPosts(1, 10, selectedLang);
        setPosts(fetchedPosts);
        setIsSearching(false);
        setLoading(false);
      }
    } catch (e) {
      console.error("Search failed:", e);
      setIsSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadVideos = async () => {
      const vids = await youtubeService.getFeaturedVideos();
      setVideos(vids);
    };
    loadVideos();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      // If we have just done a search (streamState has text), don't overwrite with default feed
      if (streamState.text) return;

      setLoading(true);
      const { posts: fetchedPosts, totalPages: fetchedTotalPages } =
        await postService.getPublishedPosts(currentPage, 10, selectedLang);
      setPosts(fetchedPosts);
      setTotalPages(fetchedTotalPages);
      setAiIntent(null);
      setLoading(false);

      if (
        !isFirstRender.current &&
        (currentPage > 1 || selectedLang !== "all")
      ) {
        document
          .getElementById("latest-stories")
          ?.scrollIntoView({ behavior: "smooth" });
      } else {
        isFirstRender.current = false;
      }
    };
    fetchContent();
  }, [currentPage, tripzy, selectedLang]); // Removed tripzy dependency to avoid double fetch logic loop

  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO
        title="Home"
        description="Discover personalized travel itineraries and lifestyle adventures with Tripzy's AI-powered planner."
      />
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <DiscoveryHero onSearch={handleSearch} isSearching={isSearching} />

        {/* Agent Streaming UI */}
        <div id="agent-response-area" className="container mx-auto px-4">
          <AgentResponse streamState={streamState} />
        </div>

        {/* YouTube Videos Section */}
        <section className="py-20 bg-navy-950/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2">
                  <span className="text-gold">▶</span>{" "}
                  {t("homepage.watchOurAdventures")}
                </h2>
                <p className="text-slate-400">{t("homepage.videoSubtitle")}</p>
              </div>
              <a
                href="https://youtube.com/@tripzytravel"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                {t("homepage.viewAllVideos")} <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videos.map((video, index) => (
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
                {t("homepage.viewAllVideos")} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Latest Stories Section */}
        <section id="latest-stories" className="py-20 bg-navy-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4">
                {t("homepage.latestStories")}
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                {t("homepage.heroSubtitle")}
              </p>
            </div>

            {/* Language Filter */}
            <div
              className="flex flex-wrap gap-2 mb-8 justify-center animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <button
                onClick={() => setSelectedLang("all")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedLang === "all"
                    ? "bg-gold text-navy-950 border-gold shadow-[0_0_15px_rgba(250,189,0,0.3)] scale-105"
                    : "bg-navy-800/50 text-slate-300 border-white/10 hover:border-gold/50 hover:text-white"
                }`}
              >
                All Stories
              </button>
              <button
                onClick={() => setSelectedLang("en")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedLang === "en"
                    ? "bg-gold text-navy-950 border-gold shadow-[0_0_15px_rgba(250,189,0,0.3)] scale-105"
                    : "bg-navy-800/50 text-slate-300 border-white/10 hover:border-gold/50 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang("tr")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedLang === "tr"
                    ? "bg-gold text-navy-950 border-gold shadow-[0_0_15px_rgba(250,189,0,0.3)] scale-105"
                    : "bg-navy-800/50 text-slate-300 border-white/10 hover:border-gold/50 hover:text-white"
                }`}
              >
                Türkçe
              </button>
            </div>

            {/* Posts Grid */}
            <div
              id="latest-stories"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {loading ? (
                // Skeleton Loading State
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonPostCard key={i} />
                ))
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <div
                    key={post.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className="animate-fade-in"
                  >
                    <PostCard post={post} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-navy-800/50 rounded-2xl border border-white/5">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-navy-800 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("homepage.noPostsFound")}
                  </h3>
                  <p className="text-slate-400">
                    Try adjusting your search or filters.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - Only show if posts exist and we are not loading */}
            {!loading && posts.length > 0 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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
