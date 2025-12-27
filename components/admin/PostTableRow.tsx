import React from "react";
// FIX: Ensure react-router-dom import is correct.
import { Link } from "react-router-dom";
import { Post, PostStatus } from "../../types";
import { Edit, Trash2 } from "lucide-react";

interface PostTableRowProps {
  post: Post;
  authorName: string;
  onDelete: (postId: string) => void;
}

const PostTableRow: React.FC<PostTableRowProps> = ({
  post,
  authorName,
  onDelete,
}) => {
  const statusColorMap: Record<
    PostStatus,
    { bg: string; text: string; dot: string }
  > = {
    [PostStatus.Published]: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      dot: "bg-green-500",
    },
    [PostStatus.Draft]: {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      dot: "bg-gray-500",
    },
    [PostStatus.PendingReview]: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      dot: "bg-yellow-500",
    },
    [PostStatus.Scheduled]: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-500",
    },
  };

  const status =
    statusColorMap[post.status] || statusColorMap[PostStatus.Draft];

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {post.featuredMediaUrl && (
            <img
              src={post.featuredMediaUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-white/5"
            />
          )}
          <div>
            <div className="text-sm font-bold text-white group-hover:text-gold transition-colors line-clamp-1">
              {post.title}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              {post.category}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-navy-700 flex items-center justify-center text-[10px] font-bold text-gold border border-white/5 uppercase">
            {authorName.charAt(0)}
          </div>
          <span className="text-sm text-gray-300">{authorName}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}
          ></span>
          {post.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
        {new Date(post.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <Link
            to={`/admin/posts/edit/${post.id}`}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
            title="Edit Post"
          >
            <Edit size={18} />
          </Link>
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Delete Post"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(PostTableRow);
