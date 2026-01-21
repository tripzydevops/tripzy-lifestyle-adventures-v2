import React from "react";
import { Link } from "react-router-dom";
import { Post } from "../../types";
import {
  Calendar,
  Tag,
  PlayCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useSignalTracker } from "../../hooks/useSignalTracker";
import { unsplashService } from "../../services/unsplashService";

interface PostCardProps {
  post: Post;
  index?: number; // Added for staggered animation delays
}

const PostCard: React.FC<PostCardProps> = ({ post, index = 0 }) => {
  const { trackClick } = useSignalTracker();
  const [displayImg, setDisplayImg] = React.useState(post.featuredMediaUrl);
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate Read Time
  const readTime = React.useMemo(() => {
    const wordCount = post.content
      ? post.content.replace(/<[^>]+>/g, "").split(" ").length
      : 0;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  }, [post.content]);

  React.useEffect(() => {
    const checkImage = async () => {
      if (
        !post.featuredMediaUrl ||
        post.featuredMediaUrl.includes("placeholder")
      ) {
        try {
          const { results } = await unsplashService.searchPhotos(
            post.title + " travel aesthetic",
            1,
            1,
          );
          if (results.length > 0) {
            setDisplayImg(results[0].url);
          }
        } catch (err) {
          console.warn("PostCard photo fetch failed", err);
        }
      }
    };
    checkImage();
  }, [post.featuredMediaUrl, post.title]);

  const handlePostClick = () => {
    trackClick("post", post.slug, {
      title: post.title,
      category: post.category,
    });
  };

  // Staggered fade-in animation style
  const animationDelay = `${index * 100}ms`;

  return (
    <article
      className="group relative h-[450px] w-full rounded-3xl overflow-hidden cursor-pointer animate-fade-in-up"
      style={{ animationDelay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/post/${post.slug}`}
        aria-label={`Read more about ${post.title}`}
        onClick={handlePostClick}
        className="block h-full w-full"
      >
        {/* 1. Background Image Layer (Parallax-ish scale effect) */}
        <div className="absolute inset-0 z-0">
          {post.featuredMediaType === "video" ? (
            <video
              src={post.featuredMediaUrl}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <img
              src={
                displayImg ||
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop"
              }
              alt={post.featuredMediaAlt || post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          )}
          {/* Cinematic Gradient Overlay (Darker at bottom for text readability) */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
        </div>

        {/* 2. Top Badges (Always visible) */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className="glass-panel px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20 shadow-lg">
            {post.category}
          </span>
          {(post as any).match_score && (post as any).match_score > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-navy-950 bg-gold shadow-[0_0_15px_rgba(255,215,0,0.4)] animate-pulse-glow">
              <Sparkles size={10} fill="currentColor" />
              {Math.round((post as any).match_score * 100)}% Match
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4 z-10">
          <span className="glass-panel px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <Clock size={12} className="text-gold" />
            {readTime}
          </span>
        </div>

        {/* 3. Content Content (Holographic Reveal) */}
        <div className="absolute bottom-0 left-0 w-full z-10 p-6 flex flex-col justify-end h-full">
          {/* Title & Meta - Shifts up on hover */}
          <div className="transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
            <div className="text-gold text-xs font-medium mb-2 opacity-80 flex items-center gap-2">
              <Calendar size={12} />
              {(() => {
                const dateStr = post.publishedAt || post.createdAt;
                if (!dateStr) return "";
                try {
                  return new Date(dateStr).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                } catch (e) {
                  return "";
                }
              })()}
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight mb-3 drop-shadow-md group-hover:text-gold-light transition-colors">
              {post.title}
            </h2>
          </div>

          {/* Hidden Details - Slides in from bottom */}
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
            <div className="overflow-hidden">
              <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                <p className="text-slate-300 text-sm line-clamp-2 mb-4 font-light leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-slate-400 border border-white/10 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center gap-2 text-gold font-bold tracking-wide uppercase text-xs mt-2 group/btn">
                  Read Story
                  <ArrowRight
                    size={14}
                    className="transform transition-transform group-hover/btn:translate-x-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Glass Overlay / Shine Effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-gold/30 transition-colors duration-300 pointer-events-none" />
      </Link>
    </article>
  );
};

export default PostCard;
