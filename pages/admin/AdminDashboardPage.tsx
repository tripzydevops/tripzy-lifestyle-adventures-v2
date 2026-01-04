import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../localization/LanguageContext";
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
import ImportViralPostModal from "../../components/admin/ImportViralPostModal";
import PostStatsChart from "../../components/admin/PostStatsChart";
import { signalService } from "../../services/signalService";

interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  pendingPosts: number;
  draftPosts: number;
}

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [signalStats, setSignalStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("🔍 AdminDashboard: Starting to fetch stats...");
        const [postStats, topPostsData, users, signals] = await Promise.all([
          postService.getPostStats(),
          postService.getTopPosts(5),
          userService.getAllUsers(),
          signalService.getSignalStats(7),
        ]);

        console.log("📊 AdminDashboard: Fetched data:", {
          postsCount: postStats.totalPosts,
          usersCount: users.length,
          signalsCount: Array.isArray(signals) ? signals.length : 0,
        });

        const totalUsers = users.length;

        // Use the stats directly from the service
        const { totalPosts, pendingPosts, draftPosts } = postStats;

        setTopPosts(topPostsData);
        setSignalStats(Array.isArray(signals) ? signals : []);
        setStats({ totalPosts, totalUsers, pendingPosts, draftPosts });
        setError(null);
        console.log("✅ AdminDashboard: Stats set successfully");
      } catch (error) {
        console.error(
          "❌ AdminDashboard: Failed to load dashboard stats:",
          error
        );
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data. Please check your Supabase connection."
        );
      } finally {
        setLoading(false);
        console.log("🏁 AdminDashboard: Loading complete");
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2">
            {t("admin.dashboard.welcomeBack")}{" "}
            <span className="text-gold">{user?.name}</span>
          </h1>
          <p className="text-gray-500">{t("admin.dashboard.monitoringText")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {t("admin.dashboard.systemOnline")}
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
      ) : error ? (
        <div className="py-20 flex flex-col items-center justify-center gap-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-500 mb-2">
                  {t("admin.dashboard.errorTitle")}
                </h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-bold transition-all"
                >
                  {t("admin.dashboard.retry")}
                </button>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm max-w-xl">
            <p className="mb-2">{t("admin.dashboard.commonIssues")}</p>
            <ul className="text-left space-y-1">
              <li>• {t("admin.dashboard.issueCredentials")}</li>
              <li>• {t("admin.dashboard.issueSchema")}</li>
              <li>• {t("admin.dashboard.issueMigration")}</li>
              <li>• {t("admin.dashboard.issueConsole")}</li>
            </ul>
          </div>
        </div>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard
                icon={<FileText size={20} />}
                label={t("admin.dashboard.activeStories")}
                value={stats.totalPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-gold"
              />
              <StatCard
                icon={<Users size={20} />}
                label={t("admin.dashboard.totalExplorers")}
                value={stats.totalUsers}
                iconBgColor="bg-navy-800"
                iconColor="text-blue-400"
              />
              <StatCard
                icon={<Eye size={20} />}
                label={t("admin.dashboard.underReview")}
                value={stats.pendingPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-orange-400"
              />
              <StatCard
                icon={<PenSquare size={20} />}
                label={t("admin.dashboard.editorialDrafts")}
                value={stats.draftPosts}
                iconBgColor="bg-navy-800"
                iconColor="text-purple-400"
              />
            </div>

            {/* Signal Intelligence Chart */}
            <div className="mb-0 animate-fade-in-up">
              <PostStatsChart data={signalStats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl group">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-gold" />
                    {t("admin.dashboard.quickActions")}
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      to="/admin/posts/new"
                      className="flex items-center justify-between p-4 bg-navy-800 hover:bg-gold hover:text-navy-950 rounded-2xl transition-all duration-300 group/btn"
                    >
                      <span className="font-bold flex items-center gap-3">
                        <PenSquare size={18} />{" "}
                        {t("admin.dashboard.newAdventure")}
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
                        <FileText size={18} />{" "}
                        {t("admin.dashboard.contentManager")}
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
                        <Eye size={18} /> {t("admin.dashboard.liveSite")}
                      </span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="w-full flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-2xl transition-all mb-2 ring-1 ring-purple-500/20"
                    >
                      <span className="font-bold flex items-center gap-3">
                        <Sparkles size={18} />{" "}
                        {t("admin.dashboard.importViralPost")}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-navy-900 to-navy-950 p-8 rounded-3xl border border-gold/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={64} className="text-gold" />
                  </div>
                  <h3 className="text-gold font-bold text-sm tracking-widest uppercase mb-4">
                    {t("admin.dashboard.autonomousTip")}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    {t("admin.dashboard.tipText")}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <ThumbsUp size={20} className="text-gold" />
                    {t("admin.dashboard.topPerforming")}
                  </h2>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {t("admin.dashboard.sortByViews")}
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
                          {t("admin.dashboard.views")}
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
      <ImportViralPostModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          alert(t("admin.dashboard.importSuccess"));
          window.location.reload();
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
