// components/common/CommentsSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Comment } from "../../types";
import { commentService } from "../../services/commentService";
import Spinner from "./Spinner";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

interface CommentsSectionProps {
  postId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();

  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (user) {
      setAuthorName(user.name);
    }
  }, [user]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedComments = await commentService.getCommentsByPostId(postId);
      setComments(fetchedComments);
    } catch (error) {
      addToast("Failed to load comments.", "error");
    } finally {
      setLoading(false);
    }
  }, [postId, addToast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !authorName.trim()) {
      addToast("Name and comment cannot be empty.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await commentService.addComment(postId, authorName, content, user?.id);
      addToast(
        "Comment submitted for review! It will appear once approved.",
        "success"
      );
      if (!user) {
        setAuthorName("");
      }
      setContent("");
      // We don't fetchComments() here because the new comment is not approved yet
    } catch (error) {
      addToast("Failed to submit comment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-3xl font-bold text-neutral mb-8">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-12">
          <h3 className="text-xl font-semibold mb-4">Leave a Reply</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="authorName"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                disabled={!!user} // Lock name for logged in users
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                Comment
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Post Comment"}
            </button>
          </form>
        </div>

        {/* Comments List */}
        <div className="space-y-8">
          {loading ? (
            <Spinner />
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">
                      {comment.authorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-600 mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              Be the first to leave a comment!
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommentsSection;
