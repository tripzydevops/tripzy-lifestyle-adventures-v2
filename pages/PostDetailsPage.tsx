import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Post, MapItem } from "../types";
import { postService } from "../services/postService";
import { aiService } from "../services/aiService";
import { unsplashService } from "../services/unsplashService";
import { mapService } from "../services/mapService";
import { useTripzy } from "../hooks/useTripzy";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import Spinner from "../components/common/Spinner";
import SEO from "../components/common/SEO";
import {
  Calendar,
  Tag,
  Folder,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import SocialShareButtons from "../components/common/SocialShareButtons";
import RelatedPosts from "../components/common/RelatedPosts";
import CommentsSection from "../components/common/CommentsSection";
import PostContentRenderer from "../components/common/PostContentRenderer";

import MapViewer from "../components/common/MapViewer";
import { useLanguage } from "../localization/LanguageContext"; // Added import

const slugify = (text: string) => {
  const turkishMap: { [key: string]: string } = {
    ı: "i",
    ğ: "g",
    ü: "u",
    ş: "s",
    ö: "o",
    ç: "c",
    I: "i",
    Ğ: "g",
    Ü: "u",
    Ş: "s",
    Ö: "o",
    Ç: "c",
  };
  return text
    .toString()
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => turkishMap[char] || char)
    .join("")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

interface Heading {
  id: string;
  text: string;
  level: number;
}

const PostDetailsPage = () => {
  const { t } = useLanguage(); // Initialize t
  const { postId: postSlug } = useParams<{ postId: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [contentWithIds, setContentWithIds] = useState("");
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [maps, setMaps] = useState<MapItem[]>([]);

  // Initialize Tripzy SDK (Essentials Layer)
  const tripzy = useTripzy();

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

          // Track View using Tripzy SDK
          if (tripzy && fetchedPost) {
            tripzy.track("view_post", {
              title: fetchedPost.title,
              category: fetchedPost.category,
              tags: fetchedPost.tags,
              slug: fetchedPost.slug,
            });
          }

          // Fetch Maps (Layer 3)
          try {
            const postMaps = await mapService.getMapsByPostId(fetchedPost.id);
            setMaps(postMaps);
          } catch (e) {
            console.error("Failed to fetch maps", e);
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
  }, [postSlug, tripzy]);

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

    // Dynamic Image Fallback
    if (post && !post.featuredMediaUrl) {
      const fetchFallbackImage = async () => {
        try {
          // Use title + aesthetic for better Unsplash match
          const query =
            (post.title.split(":")[0] || post.category || "travel") +
            " travel aesthetic";
          const { results } = await unsplashService.searchPhotos(query, 1, 1);
          if (results.length > 0) {
            setPost((prev) =>
              prev
                ? {
                    ...prev,
                    featuredMediaUrl: results[0].url,
                    featuredMediaAlt: results[0].description,
                  }
                : null
            );
          }
        } catch (e) {
          console.warn("Failed to fetch fallback image", e);
        }
      };
      fetchFallbackImage();
    }

    // Detect if content is Markdown or HTML (Matching logic in PostContentRenderer)
    const markdownHeaderCheck = /^#+\s/m.test(post.content);
    const htmlTagCount = (post.content.match(/<[^>]+>/g) || []).length;

    const isLegacyHtml =
      !markdownHeaderCheck &&
      htmlTagCount > 5 &&
      (post.content.includes("<article") ||
        post.content.includes("<div") ||
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
          {post.featuredMediaType === "video" && post.featuredMediaUrl ? (
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
              src={
                post.featuredMediaUrl ||
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000"
              }
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
                <PostContentRenderer
                  content={contentWithIds || post.content}
                  postContext={post.title}
                />
              </div>

              {/* Contextual Map Section - Layer 1 & 3 */}
              {maps.length > 0 && (
                <div className="mt-16 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <h3 className="flex items-center gap-2 text-2xl font-serif font-bold text-white mb-6">
                    <MapPin size={24} className="text-gold" />
                    Tripzy Interactive Map
                  </h3>
                  <MapViewer mapData={maps[0]} postTitle={post?.title} />
                </div>
              )}

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
