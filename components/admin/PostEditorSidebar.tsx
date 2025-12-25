import React from 'react';
// FIX: Ensure react-router-dom import is correct.
import { Link } from 'react-router-dom';
import { Post, PostStatus } from '../../types';
import { POST_CATEGORIES } from '../../constants';
import TagInput from './TagInput';
import { Eye, Image as ImageIcon, X, Video } from 'lucide-react';

interface PostEditorSidebarProps {
  post: Partial<Post>;
  onPostChange: (field: keyof Post, value: any) => void;
  onSetFeaturedMedia: () => void;
  onMediaRemove: () => void;
  isNewPost: boolean;
  isAuthor: boolean;
}

const PostEditorSidebar: React.FC<PostEditorSidebarProps> = ({
  post,
  onPostChange,
  onSetFeaturedMedia,
  onMediaRemove,
  isNewPost,
  isAuthor
}) => {
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as PostStatus;
    onPostChange('status', newStatus);
    if (newStatus === PostStatus.Scheduled && !post.publishedAt) {
      // Default to 1 day in the future if not already set
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      onPostChange('publishedAt', tomorrow.toISOString().slice(0, 16));
    }
  };

  return (
    <div className="space-y-6">
      {/* Publishing Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              id="status"
              value={post.status}
              onChange={handleStatusChange}
              className="w-full border-gray-300 rounded-md"
              disabled={isAuthor && post.status === PostStatus.PendingReview}
            >
              <option value={PostStatus.Draft}>Draft</option>
              <option value={PostStatus.PendingReview}>Pending Review</option>
              {!isAuthor && <option value={PostStatus.Published}>Published</option>}
              {!isAuthor && <option value={PostStatus.Scheduled}>Scheduled</option>}
            </select>
          </div>
          {post.status === PostStatus.Scheduled && (
            <div>
              <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
              <input 
                type="datetime-local" 
                id="publishedAt"
                name="publishedAt"
                value={post.publishedAt ? post.publishedAt.slice(0, 16) : ''}
                onChange={(e) => onPostChange('publishedAt', e.target.value)}
                className="w-full border-gray-300 rounded-md"
              />
            </div>
          )}
          {!isNewPost && post.slug && (
            <Link to={`/post/${post.slug}`} target="_blank" className="text-primary hover:underline flex items-center text-sm">
              <Eye size={16} className="mr-2" /> View Post
            </Link>
          )}
        </div>
      </div>

      {/* Organization Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              id="category"
              value={post.category}
              onChange={(e) => onPostChange('category', e.target.value)}
              className="w-full border-gray-300 rounded-md"
            >
              {POST_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <TagInput
            tags={post.tags || []}
            onTagsChange={(newTags) => onPostChange('tags', newTags)}
          />
        </div>
      </div>

      {/* Featured Media Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Media</h3>
        {post.featuredMediaUrl ? (
            <div className="relative group aspect-video bg-gray-100 rounded-md">
                {post.featuredMediaType === 'video' ? (
                    <video src={post.featuredMediaUrl} className="rounded-md w-full h-full object-cover" muted loop autoPlay />
                ) : (
                    <img src={post.featuredMediaUrl} alt="Featured" className="rounded-md w-full h-full object-cover" />
                )}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md gap-4">
                    <button type="button" onClick={onSetFeaturedMedia} className="bg-white/80 text-gray-800 rounded-full p-2 hover:bg-white" aria-label="Change Media">
                       {post.featuredMediaType === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                    </button>
                    <button type="button" onClick={onMediaRemove} className="bg-white/80 text-red-600 rounded-full p-2 hover:bg-white" aria-label="Remove Media">
                        <X size={20} />
                    </button>
                </div>
            </div>
        ) : (
            <button type="button" onClick={onSetFeaturedMedia} className="w-full h-32 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <ImageIcon size={32} />
                <span className="mt-2 text-sm font-semibold">Set Featured Media</span>
            </button>
        )}
        
        {post.featuredMediaUrl && (
          <div className="mt-4">
            <label htmlFor="featuredMediaAlt" className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              name="featuredMediaAlt"
              id="featuredMediaAlt"
              value={post.featuredMediaAlt || ''}
              onChange={(e) => onPostChange('featuredMediaAlt', e.target.value)}
              className="w-full border-gray-300 rounded-md"
              placeholder="Describe the media for accessibility"
            />
            <p className="text-xs text-gray-500 mt-1">Important for SEO and screen readers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PostEditorSidebar);
