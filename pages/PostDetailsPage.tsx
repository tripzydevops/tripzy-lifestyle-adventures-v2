import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Post, User as UserType } from "../types";
import { postService } from "../services/postService";
import { userService } from "../services/userService";
import { aiService, decodeBase64 } from "../services/aiService";
import { useTripzy } from "../hooks/useTripzy";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import Spinner from "../components/common/Spinner";
import SEO from "../components/common/SEO";
import {
  Calendar,
  User,
  Tag,
  Folder,
  Volume2,
  LoaderCircle,
  Pause,
  Play,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import SocialShareButtons from "../components/common/SocialShareButtons";
import RelatedPosts from "../components/common/RelatedPosts";
import CommentsSection from "../components/common/CommentsSection";
import PostContentRenderer from "../components/common/PostContentRenderer";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

interface Heading {
  id: string;
  text: string;
  level: number;
}

const PostDetailsPage = () => {
  const { postId: postSlug } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Tripzy SDK (Essentials Layer)
  const tripzy = useTripzy();

  const [headings, setHeadings] = useState<Heading[]>([]);
  const [contentWithIds, setContentWithIds] = useState("");
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Local Discoveries State
  const [attractions, setAttractions] = useState<{
    text: string;
    sources: any[];
  } | null>(null);
  const [loadingAttractions, setLoadingAttractions] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      if (!postSlug) return;
      setLoading(true);
      try {
        const fetchedPost = await postService.getPostBySlug(postSlug);
        if (fetchedPost) {
          setPost(fetchedPost);
          const fetchedAuthor = await userService.getUserById(
            fetchedPost.authorId
          );
          setAuthor(fetchedAuthor || null);

          // Track View using Tripzy SDK
          if (tripzy && fetchedPost) {
            tripzy.track("view_post", {
              title: fetchedPost.title,
              category: fetchedPost.category,
              tags: fetchedPost.tags,
              slug: fetchedPost.slug,
            });
          }

          fetchAttractions(fetchedPost.title);
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Failed to fetch post details:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPostData();

    return () => {
      stopAudio();
    };
  }, [postSlug]);

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const fetchAttractions = async (query: string) => {
    setLoadingAttractions(true);
    let lat, lng;

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          });
        }
      );
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (e) {
      console.debug("Geolocation not available or denied.");
    }

    const result = await aiService.getNearbyAttractions(query, lat, lng);
    setAttractions(result);
    setLoadingAttractions(false);
  };

  useEffect(() => {
    if (!post?.content) {
      setHeadings([]);
      setContentWithIds("");
      return;
    }

    // Detect if content is Markdown or HTML (Matching logic in PostContentRenderer)
    const hasHtmlTags = /<p>|<div|<article|<span|<br/i.test(post.content);
    const isLegacyHtml =
      hasHtmlTags &&
      (post.content.includes("<article") ||
        (post.content.match(/<p>/g) || []).length > 2);
    const isMarkdown = !isLegacyHtml;

    const newHeadings: Heading[] = [];

    if (isMarkdown) {
      // Strip internal sections before extracting headings
      const filteredContent = post.content
        .replace(/## 🛠 TRIPZY INTELLIGENCE DATA[\s\S]*?(?=##|$)/gi, "")
        .replace(/## (The )?Multi-Agent Perspective[\s\S]*?(?=##|$)/gi, "")
        .replace(/## (The )?Agent Approach[\s\S]*?(?=##|$)/gi, "");

      // Extract Markdown headings
      const headingLines = filteredContent.split("\n");

      headingLines.forEach((line, index) => {
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const baseSlug = slugify(text);
          const id = baseSlug;

          newHeadings.push({ id, text, level });
        }
      });

      setHeadings(newHeadings);
      setContentWithIds(post.content); // Let the renderer handle filtering/Markdown
    } else {
      // Legacy HTML Heading Extraction
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = post.content;
      const headingElements = tempDiv.querySelectorAll("h2, h3");

      headingElements.forEach((el, index) => {
        const heading = el as HTMLElement;
        const text = heading.innerText;
        if (!text) return;

        const baseSlug = slugify(text);
        const id = baseSlug ? `${baseSlug}-${index}` : `heading-${index}`;
        heading.id = id;

        newHeadings.push({
          id,
          text,
          level: Number(heading.tagName.substring(1)),
        });
      });

      setHeadings(newHeadings);
      setContentWithIds(tempDiv.innerHTML);
    }
  }, [post]);

  /**
   * Correct Raw PCM Decoding for Gemini TTS
   */
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const handleToggleAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!post) return;
    setIsGeneratingAudio(true);
    try {
      // Clean text for better speech
      const rawText = post.content
        .replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "and");

      // The service now handles the actual speaking via Web Speech API
      const result = await aiService.generateAudio(rawText);

      if (result === "WEB_SPEECH_API_ACTIVE") {
        setIsPlaying(true);

        // Poll for end of speech since we can't easily pass the 'onend' callback through the Promise
        const checkInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            setIsPlaying(false);
            clearInterval(checkInterval);
          }
        }, 1000);
      }
    } catch (e) {
      console.error("Audio generation failed:", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-navy-950">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Spinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-navy-950">
        <Header />
        <main className="flex-grow text-center py-20 px-4">
          <h1 className="text-4xl font-bold text-white">Post not found</h1>
          <p className="text-gray-400 mt-4">
            Sorry, we couldn't find the post you were looking for.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block bg-gold text-navy-950 px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            Back to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        keywords={post.metaKeywords || post.tags.join(", ")}
        ogImage={
          post.featuredMediaType === "image" ? post.featuredMediaUrl : undefined
        }
        ogVideo={
          post.featuredMediaType === "video" ? post.featuredMediaUrl : undefined
        }
        type="article"
      />
      <Header />
      <main className="flex-grow">
        <div className="relative h-96 md:h-[500px] bg-black">
          {post.featuredMediaType === "video" ? (
            <video
              src={post.featuredMediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              aria-label={post.featuredMediaAlt || post.title}
            />
          ) : (
            <img
              src={post.featuredMediaUrl}
              alt={post.featuredMediaAlt || post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex flex-col justify-end pb-12 text-white">
            <h1 className="text-4xl md:text-6xl font-bold font-serif">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-6 text-sm opacity-90">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : "Unpublished"}
                </span>
              </div>
              <div className="flex items-center">
                <Folder size={16} className="mr-2" />
                <Link
                  to={`/category/${post.category}`}
                  className="hover:underline"
                >
                  {post.category}
                </Link>
              </div>
              {author && (
                <div className="flex items-center">
                  <User size={16} className="mr-2" />
                  <Link
                    to={`/author/${author.slug}`}
                    className="hover:underline"
                  >
                    By {author.name}
                  </Link>
                </div>
              )}

              <button
                onClick={handleToggleAudio}
                disabled={isGeneratingAudio}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 transition-all group"
              >
                {isGeneratingAudio ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span className="font-semibold">
                  {isGeneratingAudio
                    ? "Generating..."
                    : isPlaying
                    ? "Stop Reader"
                    : "Listen to Post"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-12">
            {headings.length > 0 && (
              <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-24">
                  <h3 className="font-semibold font-serif text-lg mb-4 text-white border-b border-white/10 pb-2">
                    Table of Contents
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document
                              .getElementById(heading.id)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`
                                                block border-l-4 py-1 transition-colors duration-200
                                                ${
                                                  heading.level === 3
                                                    ? "pl-8"
                                                    : "pl-4"
                                                }
                                                ${
                                                  activeHeadingId === heading.id
                                                    ? "border-gold text-gold font-semibold"
                                                    : "border-transparent text-gray-500 hover:text-gold hover:border-white/20"
                                                }
                                            `}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>

                  {(loadingAttractions || attractions) && (
                    <div
                      onMouseEnter={() => {
                        if (tripzy && post) {
                          tripzy.track("interest_local", { title: post.title });
                        }
                      }}
                      className="mt-12 bg-navy-800 p-4 rounded-xl border border-white/10 shadow-lg"
                    >
                      <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                        <MapPin size={16} className="text-gold" />
                        Local Discoveries
                      </h4>
                      {loadingAttractions ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-navy-700 rounded w-full"></div>
                          <div className="h-3 bg-navy-700 rounded w-5/6"></div>
                        </div>
                      ) : (
                        attractions && (
                          <div className="space-y-4">
                            <p className="text-xs text-gray-400 italic">
                              Recommendations near this destination:
                            </p>
                            <div className="space-y-3">
                              {attractions.sources.map(
                                (chunk, idx) =>
                                  chunk.maps && (
                                    <a
                                      key={idx}
                                      href={chunk.maps.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group block text-xs border-b border-white/5 pb-2 hover:text-gold transition-colors"
                                    >
                                      <span className="font-bold block group-hover:underline text-gray-200">
                                        {chunk.maps.title}
                                      </span>
                                      <span className="text-gray-500 flex items-center gap-1 mt-1">
                                        View on Maps <ExternalLink size={10} />
                                      </span>
                                    </a>
                                  )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </aside>
            )}

            <div
              className={
                headings.length > 0
                  ? "lg:col-span-9"
                  : "lg:col-span-12 max-w-4xl mx-auto"
              }
            >
              <div className="prose prose-invert lg:prose-xl max-w-none text-gray-300">
                <PostContentRenderer content={contentWithIds || post.content} />
              </div>

              {attractions && (
                <div className="mt-16 p-8 bg-navy-800/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                  <h3 className="flex items-center gap-2 text-2xl font-serif font-bold text-white mb-4">
                    <Sparkles size={24} className="text-gold" />
                    AI Local Guide
                  </h3>
                  <div className="prose prose-invert prose-blue max-w-none text-gray-300 whitespace-pre-wrap">
                    {attractions.text}
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/10">
                {post.tags.length > 0 && (
                  <div className="flex items-center text-sm text-gray-400 mb-6">
                    <Tag size={16} className="mr-2" />
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/tag/${tag}`}
                          className="bg-navy-800 text-gray-300 px-3 py-1 rounded-full text-sm font-medium hover:bg-gold hover:text-navy-950 transition-all"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <SocialShareButtons post={post} />
              </div>
            </div>
          </div>
        </div>
        <RelatedPosts currentPostId={post.id} category={post.category} />
        <CommentsSection postId={post.id} />
      </main>
      <Footer />
    </div>
  );
};

export default PostDetailsPage;
