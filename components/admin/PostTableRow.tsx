import React from 'react';
// FIX: Ensure react-router-dom import is correct.
import { Link } from 'react-router-dom';
import { Post, PostStatus } from '../../types';
import { Edit, Trash2 } from 'lucide-react';

interface PostTableRowProps {
  post: Post;
  authorName: string;
  onDelete: (postId: string) => void;
}

const PostTableRow: React.FC<PostTableRowProps> = ({ post, authorName, onDelete }) => {
  const statusColorMap: Record<PostStatus, string> = {
    [PostStatus.Published]: 'bg-green-100 text-green-800',
    [PostStatus.Draft]: 'bg-gray-100 text-gray-800',
    [PostStatus.PendingReview]: 'bg-yellow-100 text-yellow-800',
    [PostStatus.Scheduled]: 'bg-blue-100 text-blue-800',
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{post.title}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{authorName}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[post.status]}`}>
          {post.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.updatedAt).toLocaleDateString()}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link to={`/admin/posts/edit/${post.id}`} className="text-primary hover:text-blue-800 mr-4 inline-block align-middle">
          <Edit size={18} />
        </Link>
        <button onClick={() => onDelete(post.id)} className="text-red-600 hover:text-red-900 align-middle">
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default React.memo(PostTableRow);
