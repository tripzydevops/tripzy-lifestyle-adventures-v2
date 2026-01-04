import React, { useState, useEffect } from "react";
import { commentService } from "../../services/commentService";
import { Comment } from "../../types";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import { MessageSquare, Check, Trash2, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ManageCommentsPage = () => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await commentService.getPendingComments();
      setComments(data);
    } catch (error) {
      addToast("Failed to load comments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [addToast]);

  const handleApprove = async (id: string) => {
    try {
      await commentService.approveComment(id);
      setComments(comments.filter((c) => c.id !== id));
      addToast("Comment approved", "success");
    } catch (error) {
      addToast("Failed to approve comment", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      await commentService.deleteComment(id);
      setComments(comments.filter((c) => c.id !== id));
      addToast("Comment deleted", "success");
    } catch (error) {
      addToast("Failed to delete comment", "error");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <MessageSquare size={32} className="text-gold" />
            {t("admin.comments.title") || "Comment Moderation"}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("admin.comments.subtitle") ||
              "Review and approve pending comments from users."}
          </p>
        </div>
        <div className="px-4 py-2 bg-navy-800 rounded-xl border border-white/5 text-sm font-bold text-gold">
          {comments.length} {t("admin.comments.pending") || "Pending"}
        </div>
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-navy-800/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-gold/20 transition-all group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                      {comment.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {comment.authorName}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2">
                        <Clock size={10} />
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-300 text-sm leading-relaxed p-4 bg-navy-950/50 rounded-xl border border-white/5 italic">
                      "{comment.content}"
                    </p>
                  </div>

                  <div className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Link
                      to={`/post/${comment.postId}`}
                      target="_blank"
                      className="flex items-center gap-1"
                    >
                      {t("admin.comments.viewPost") || "View Post"}{" "}
                      <AlertCircle size={10} />
                    </Link>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-4">
                  <button
                    onClick={() => handleApprove(comment.id)}
                    className="p-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    title={t("admin.comments.approve") || "Approve"}
                  >
                    <Check size={18} />
                    <span className="md:hidden">
                      {t("admin.comments.approve") || "Approve"}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    title={t("admin.comments.delete") || "Delete"}
                  >
                    <Trash2 size={18} />
                    <span className="md:hidden">
                      {t("admin.comments.delete") || "Delete"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            <Check size={48} className="mx-auto mb-4 text-green-500/50" />
            <p className="text-lg font-bold text-white mb-2">
              {t("admin.comments.empty") || "All Caught Up!"}
            </p>
            <p>
              {t("admin.comments.emptySubtitle") ||
                "No pending comments to review."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCommentsPage;
