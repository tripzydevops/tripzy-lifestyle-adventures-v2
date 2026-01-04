import React from "react";
// FIX: Ensure react-router-dom import is correct.
import { Link } from "react-router-dom";
import { Post, PostStatus } from "../../types";
import { POST_CATEGORIES } from "../../constants";
import TagInput from "./TagInput";
import { Eye, Image as ImageIcon, X, Video } from "lucide-react";

interface PostEditorSidebarProps {
  post: Partial<Post>;
  onPostChange: (field: keyof Post, value: any) => void;
  onSetFeaturedMedia: () => void;
  onMediaRemove: () => void;
  isNewPost: boolean;
  isAuthor: boolean;
}

import { useLanguage } from "../../localization/LanguageContext";

const PostEditorSidebar: React.FC<PostEditorSidebarProps> = ({
  post,
  onPostChange,
  onSetFeaturedMedia,
  onMediaRemove,
  isNewPost,
  isAuthor,
}) => {
  const { t } = useLanguage();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as PostStatus;
    onPostChange("status", newStatus);
    if (newStatus === PostStatus.Scheduled && !post.publishedAt) {
      // Default to 1 day in the future if not already set
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      onPostChange("publishedAt", tomorrow.toISOString().slice(0, 16));
    }
  };

  return (
    <div className="space-y-6">
      {/* Publishing Panel */}
      <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl">
        <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
          {t("admin.form.publishing")}
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="status"
              className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1"
            >
              {t("admin.form.status")}
            </label>
            <select
              name="status"
              id="status"
              value={post.status}
              onChange={handleStatusChange}
              className="w-full bg-navy-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all cursor-pointer"
              disabled={isAuthor && post.status === PostStatus.PendingReview}
            >
              <option value={PostStatus.Draft} className="bg-navy-900">
                {t("admin.saveDraft")}
              </option>
              <option value={PostStatus.PendingReview} className="bg-navy-900">
                {t("admin.submitReview")}
              </option>
              {!isAuthor && (
                <option value={PostStatus.Published} className="bg-navy-900">
                  {t("admin.publishNow")}
                </option>
              )}
              {!isAuthor && (
                <option value={PostStatus.Scheduled} className="bg-navy-900">
                  {t("admin.schedule")}
                </option>
              )}
            </select>
          </div>
          {post.status === PostStatus.Scheduled && (
            <div>
              <label
                htmlFor="publishedAt"
                className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1"
              >
                {t("admin.form.publishedAt")}
              </label>
              <input
                type="datetime-local"
                id="publishedAt"
                name="publishedAt"
                value={post.publishedAt ? post.publishedAt.slice(0, 16) : ""}
                onChange={(e) => onPostChange("publishedAt", e.target.value)}
                className="w-full bg-navy-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all [color-scheme:dark]"
              />
            </div>
          )}
          {!isNewPost && post.slug && (
            <Link
              to={`/post/${post.slug}`}
              target="_blank"
              className="text-gold hover:text-gold/80 flex items-center text-sm font-bold mt-4"
            >
              <Eye size={16} className="mr-2" /> View Live Post
            </Link>
          )}
        </div>
      </div>

      {/* Organization Panel */}
      <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl">
        <h3 className="text-xl font-serif font-bold text-white mb-6">
          {t("admin.settings.general")}
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="category"
              className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1"
            >
              {t("admin.form.category")}
            </label>
            <select
              name="category"
              id="category"
              value={post.category}
              onChange={(e) => onPostChange("category", e.target.value)}
              className="w-full bg-navy-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all cursor-pointer"
            >
              {POST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-navy-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">
            {t("admin.form.tags")}
          </div>
          <TagInput
            tags={post.tags || []}
            onTagsChange={(newTags) => onPostChange("tags", newTags)}
          />
        </div>
      </div>

      {/* Featured Media Panel */}
      <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl">
        <h3 className="text-xl font-serif font-bold text-white mb-6">
          {t("admin.form.featuredImage")}
        </h3>
        {post.featuredMediaUrl ? (
          <div className="relative group aspect-video bg-navy-800 rounded-2xl overflow-hidden border border-white/5">
            {post.featuredMediaType === "video" ? (
              <video
                src={post.featuredMediaUrl}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
              />
            ) : (
              <img
                src={post.featuredMediaUrl}
                alt="Featured"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
              <button
                type="button"
                onClick={onSetFeaturedMedia}
                className="bg-white/10 text-white rounded-xl p-3 hover:bg-gold hover:text-navy-950 transition-all"
                aria-label="Change Media"
              >
                {post.featuredMediaType === "video" ? (
                  <Video size={20} />
                ) : (
                  <ImageIcon size={20} />
                )}
              </button>
              <button
                type="button"
                onClick={onMediaRemove}
                className="bg-red-500/10 text-red-400 rounded-xl p-3 hover:bg-red-500 hover:text-white transition-all"
                aria-label="Remove Media"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSetFeaturedMedia}
            className="w-full h-40 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 bg-navy-800/30 text-gray-500 hover:border-gold/50 hover:text-gold hover:bg-navy-800/50 transition-all group"
          >
            <ImageIcon
              size={32}
              className="group-hover:scale-110 transition-transform mb-2"
            />
            <span className="text-xs font-bold uppercase tracking-widest">
              Select Featured Media
            </span>
          </button>
        )}

        {post.featuredMediaUrl && (
          <div className="mt-4">
            <label
              htmlFor="featuredMediaAlt"
              className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1"
            >
              Alt Text
            </label>
            <input
              type="text"
              name="featuredMediaAlt"
              id="featuredMediaAlt"
              value={post.featuredMediaAlt || ""}
              onChange={(e) => onPostChange("featuredMediaAlt", e.target.value)}
              className="w-full bg-navy-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-gray-600"
              placeholder="Describe the media for accessibility"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PostEditorSidebar);
