import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FileText,
  Users,
  Eye,
  PenSquare,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { postService } from "../../services/postService";
import { userService } from "../../services/userService";
import { PostStatus, Post } from "../../types";
import Spinner from "../../components/common/Spinner";
import StatCard from "../../components/admin/StatCard";

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
        const pendingPosts = posts.filter(
          (p) => p.status === PostStatus.PendingReview
        ).length;
        const draftPosts = posts.filter(
          (p) => p.status === PostStatus.Draft
        ).length;

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
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2">
            Welcome back, <span className="text-gold">{user?.name}</span>
          </h1>
          <p className="text-gray-500">
            Monitoring Tripzy Lifestyle Adventures platform health and content
            performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </div>
          <div className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard
                icon={<FileText size={20} />}
                label="Active Stories"
                value={stats.totalPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-gold"
              />
              <StatCard
                icon={<Users size={20} />}
                label="Total Explorers"
                value={stats.totalUsers}
                iconBgColor="bg-navy-800"
                iconColor="text-blue-400"
              />
              <StatCard
                icon={<Eye size={20} />}
                label="Under Review"
                value={stats.pendingPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-orange-400"
              />
              <StatCard
                icon={<PenSquare size={20} />}
                label="Editorial Drafts"
                value={stats.draftPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl group">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-gold" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      to="/admin/posts/new"
                      className="flex items-center justify-between p-4 bg-navy-800 hover:bg-gold hover:text-navy-950 rounded-2xl transition-all duration-300 group/btn"
                    >
                      <span className="font-bold flex items-center gap-3">
                        <PenSquare size={18} /> New Adventure
                      </span>
                      <ChevronRight
                        size={16}
                        className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all"
                      />
                    </Link>
                    <Link
                      to="/admin/posts"
                      className="flex items-center justify-between p-4 bg-navy-800/50 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl transition-all"
                    >
                      <span className="font-bold flex items-center gap-3">
                        <FileText size={18} /> Content Manager
                      </span>
                      <ChevronRight size={16} />
                    </Link>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-navy-800/50 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl transition-all"
                    >
                      <span className="font-bold flex items-center gap-3">
                        <Eye size={18} /> Live Site
                      </span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-navy-900 to-navy-950 p-8 rounded-3xl border border-gold/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={64} className="text-gold" />
                  </div>
                  <h3 className="text-gold font-bold text-sm tracking-widest uppercase mb-4">
                    Autonomous Tip
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "Travelers are searching more for hidden local gems in
                    Tokyo. Consider highlighting more independent cafes in your
                    next guide."
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <ThumbsUp size={20} className="text-gold" />
                    Top Performing Stories
                  </h2>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Sort by Views
                  </div>
                </div>

                <div className="space-y-2">
                  {topPosts.map((post, idx) => (
                    <Link
                      key={post.id}
                      to={`/admin/posts/edit/${post.id}`}
                      className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-all group"
                    >
                      <span className="text-2xl font-serif font-black text-white/10 group-hover:text-gold/20 transition-colors w-8">
                        0{idx + 1}
                      </span>
                      <div className="flex-grow min-w-0">
                        <div className="text-white font-bold truncate mb-1 group-hover:text-gold transition-colors">
                          {post.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="text-gold uppercase tracking-tighter">
                            {post.category}
                          </span>
                          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                          <span>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white mb-0.5">
                          {post.views.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                          Views
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AdminDashboardPage;
