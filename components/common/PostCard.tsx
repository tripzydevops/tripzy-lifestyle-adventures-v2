import React from "react";
import { Link } from "react-router-dom";
import { Post } from "../../types";
import { Calendar, Tag, PlayCircle, Clock, ArrowRight } from "lucide-react";
import { useSignalTracker } from "../../hooks/useSignalTracker";
import { unsplashService } from "../../services/unsplashService";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { trackClick } = useSignalTracker();
  const [displayImg, setDisplayImg] = React.useState(post.featuredMediaUrl);

  // Calculate Read Time (Avg 200 wpm)
  const readTime = React.useMemo(() => {
    const wordCount = post.content
      ? post.content.replace(/<[^>]+>/g, "").split(" ").length
      : 0;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  }, [post.content]);

  React.useEffect(() => {
    // If no image or it's a placeholder, try to find a relevant one
    const checkImage = async () => {
      if (
        !post.featuredMediaUrl ||
        post.featuredMediaUrl.includes("placeholder")
      ) {
        try {
          const { results } = await unsplashService.searchPhotos(
            post.title + " travel aesthetic",
            1,
            1
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
  return (
    <article className="bg-navy-800 rounded-2xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-300 group flex flex-col hover:-translate-y-2 hover:shadow-xl hover:shadow-gold/10">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <Link
          to={`/post/${post.slug}`}
          aria-label={`Read more about ${post.title}`}
          onClick={handlePostClick}
        >
          {post.featuredMediaType === "video" ? (
            <div className="relative w-full h-56">
              <video
                src={post.featuredMediaUrl}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-navy-950/40 flex items-center justify-center">
                <PlayCircle
                  size={48}
                  className="text-white/90 group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-56 bg-navy-800">
              <img
                src={
                  displayImg ||
                  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop"
                }
                alt={post.featuredMediaAlt || post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
            </div>
          )}
        </Link>

        {/* Read Time Badge */}
        <div className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur-sm text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/10">
          <Clock size={12} className="text-gold" />
          {readTime}
        </div>

        {/* Category Badge */}
        <Link
          to={`/category/${post.category}`}
          className="absolute top-4 left-4 bg-gold/90 text-navy-950 text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-gold transition-colors shadow-lg"
        >
          {post.category}
        </Link>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Date & Match Score */}
        <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            <span>
              {(() => {
                const dateStr = post.publishedAt || post.createdAt;
                if (!dateStr) return "";
                try {
                  const date = new Date(dateStr);
                  if (isNaN(date.getTime())) return ""; // Safe check for Invalid Date
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                } catch (e) {
                  return "";
                }
              })()}
            </span>
          </div>

          {/* AI Match Score Badge - Only shows if post came from Intelligence SDK */}
          {(post as any).match_score && (post as any).match_score > 0 && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Match: {Math.round((post as any).match_score * 100)}%
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-serif font-bold text-white mb-3 line-clamp-2 group-hover:text-gold transition-colors">
          <Link to={`/post/${post.slug}`} onClick={handlePostClick}>
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-slate-400 text-sm mb-4 flex-grow line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center text-sm text-slate-500 mb-4">
            <Tag size={14} className="mr-2 text-slate-500" />
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${tag}`}
                  className="bg-navy-700 text-slate-300 px-2 py-0.5 rounded text-xs hover:bg-gold hover:text-navy-950 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Read More Button */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <Link
            to={`/post/${post.slug}`}
            className="inline-flex items-center gap-2 text-gold font-medium hover:text-gold-light transition-colors group/btn"
            aria-label={`Read more about ${post.title}`}
            onClick={handlePostClick}
          >
            Read More
            <ArrowRight
              size={16}
              className="group-hover/btn:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
