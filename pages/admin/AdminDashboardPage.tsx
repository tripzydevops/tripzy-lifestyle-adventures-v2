import React, { useState, useEffect } from 'react';
// FIX: Ensure react-router-dom import is correct.
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FileText, Users, Eye, PenSquare, ThumbsUp } from 'lucide-react';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { PostStatus, Post } from '../../types';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/admin/StatCard';

interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  pendingPosts: number;
  draftPosts: number;
}

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [posts, users] = await Promise.all([
          postService.getAllPosts(),
          userService.getAllUsers(),
        ]);

        const totalPosts = posts.length;
        const totalUsers = users.length;
        const pendingPosts = posts.filter(p => p.status === PostStatus.PendingReview).length;
        const draftPosts = posts.filter(p => p.status === PostStatus.Draft).length;

        const sortedPosts = [...posts].sort((a, b) => b.views - a.views);
        setTopPosts(sortedPosts.slice(0, 5));

        setStats({ totalPosts, totalUsers, pendingPosts, draftPosts });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {user?.name}!</h1>
      <p className="text-gray-600 mb-8">Here's a quick overview of your site.</p>

      {loading ? <Spinner /> : stats && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<FileText />} 
                    label="Total Posts" 
                    value={stats.totalPosts} 
                    iconBgColor="bg-blue-100"
                    iconColor="text-primary"
                />
                <StatCard 
                    icon={<Users />} 
                    label="Total Users" 
                    value={stats.totalUsers} 
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatCard 
                    icon={<Eye />} 
                    label="Pending Review" 
                    value={stats.pendingPosts} 
                    iconBgColor="bg-orange-100"
                    iconColor="text-orange-600"
                />
                <StatCard 
                    icon={<PenSquare />} 
                    label="Drafts" 
                    value={stats.draftPosts} 
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/admin/posts/new" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-800 transition">New Post</Link>
                        <Link to="/admin/posts" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition">Manage Posts</Link>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition">View Website</a>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <ThumbsUp size={20} className="mr-2 text-accent" />
                        Top Posts
                    </h2>
                    <ul className="space-y-3">
                        {topPosts.map(post => (
                            <li key={post.id} className="flex justify-between items-center text-sm">
                                <Link to={`/admin/posts/edit/${post.id}`} className="text-gray-700 hover:text-primary truncate" title={post.title}>
                                    {post.title}
                                </Link>
                                <span className="font-semibold text-gray-500 flex items-center">
                                    <Eye size={14} className="mr-1" /> {post.views.toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
