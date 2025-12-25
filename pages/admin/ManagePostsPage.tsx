import React, { useState, useEffect, useCallback } from 'react';
// FIX: Ensure react-router-dom import is correct.
import { Link } from 'react-router-dom';
import { Post, User } from '../../types';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import Spinner from '../../components/common/Spinner';
import { PlusCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import PostTableRow from '../../components/admin/PostTableRow';

const ManagePostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedPosts, fetchedUsers] = await Promise.all([
        postService.getAllPosts(),
        userService.getAllUsers(),
      ]);
      setPosts(fetchedPosts);
      setUsers(fetchedUsers);
    } catch (error) {
      addToast('Failed to fetch data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getUserName = useCallback((authorId: string) => {
    return users.find(u => u.id === authorId)?.name || 'Unknown';
  }, [users]);
  
  const handleDelete = useCallback(async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
        try {
            await postService.deletePost(postId);
            addToast('Post deleted successfully', 'success');
            fetchData();
        } catch (error) {
            addToast('Failed to delete post.', 'error');
        }
    }
  }, [addToast, fetchData]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Posts</h1>
        <Link to="/admin/posts/new" className="bg-primary text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-800 transition">
          <PlusCircle size={20} className="mr-2" />
          New Post
        </Link>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        {loading ? <Spinner /> : (
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.length > 0 ? posts.map(post => (
                <PostTableRow 
                  key={post.id} 
                  post={post} 
                  authorName={getUserName(post.authorId)} 
                  onDelete={handleDelete} 
                />
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No posts found. Create one!</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagePostsPage;
