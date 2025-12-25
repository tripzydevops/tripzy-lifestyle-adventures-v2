import React from "react";
import { Link } from "react-router-dom";
import { Post } from "../../types";
import { Calendar, Tag, PlayCircle, ArrowRight } from "lucide-react";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <article className="bg-navy-800 rounded-2xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-300 group flex flex-col hover:-translate-y-2 hover:shadow-xl hover:shadow-gold/10">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <Link
          to={`/post/${post.slug}`}
          aria-label={`Read more about ${post.title}`}
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
            <div className="relative w-full h-56">
              <img
                src={post.featuredMediaUrl}
                alt={post.featuredMediaAlt || post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
            </div>
          )}
        </Link>

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
        {/* Date */}
        <div className="flex items-center text-sm text-slate-400 mb-3">
          <Calendar size={14} className="mr-2" />
          <span>
            {new Date(post.publishedAt!).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-serif font-bold text-white mb-3 line-clamp-2 group-hover:text-gold transition-colors">
          <Link to={`/post/${post.slug}`}>{post.title}</Link>
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
