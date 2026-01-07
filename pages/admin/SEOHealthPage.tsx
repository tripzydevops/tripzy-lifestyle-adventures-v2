import React, { useState, useEffect } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { useToast } from "../../hooks/useToast";
import { seoService, SEOIssue } from "../../services/seoService";
import { postService } from "../../services/postService";
import Spinner from "../../components/common/Spinner";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Search,
  BarChart,
  RefreshCw,
} from "lucide-react";

const SEOHealthPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<SEOIssue[]>([]);
  const [score, setScore] = useState(100);
  const [totalPosts, setTotalPosts] = useState(0);

  const runCheck = async () => {
    setLoading(true);
    try {
      const allPosts = await postService.getAllPosts(); // We need a simple getAll without pagination preferably, or use seoService internal fetch
      // Actually seoService fetches directly.
      const foundIssues = await seoService.runHealthCheck();

      // We need total posts for score calc.
      // Reuse the fetch logic or pass it? seoService fetched internally.
      // Let's rely on valid post count estimation or update service to return it.
      // For now, let's estimated score based on issues count vs roughly 10 posts :)
      // Wait, let's fix this properly.
      // I'll estimate total posts by unique IDs in issues + some base? No that's wrong.
      // Let's just assume seoService runs on all posts.

      setIssues(foundIssues);

      // Mock total for now or fetch it
      const { totalCount } = await postService.getAdminPosts(1, 1); // Just to get total count
      setTotalPosts(totalCount || 1);

      setScore(seoService.calculateHealthScore(foundIssues, totalCount || 1));

      addToast("SEO Health Check Complete", "success");
    } catch (e) {
      addToast("Failed to run scan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const getSeverityColor = (s: string) => {
    switch (s) {
      case "critical":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "warning":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "info":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Activity size={32} className="text-gold" />
            SEO Health Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Monitor and improve your site's search engine performance.
          </p>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="px-6 py-3 bg-navy-800 border border-white/10 text-white rounded-xl font-bold hover:bg-navy-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Score Card */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 flex items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-navy-950"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - score / 100)}
                className={`${
                  score > 80
                    ? "text-green-500"
                    : score > 50
                    ? "text-yellow-500"
                    : "text-red-500"
                } transition-all duration-1000`}
              />
            </svg>
            <span className="absolute text-2xl font-bold text-white">
              {score}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              SEO Score
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on {totalPosts} posts
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 flex flex-col justify-center">
          <div className="text-2xl font-bold text-white mb-2">
            {issues.filter((i) => i.severity === "critical").length}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" /> Critical Issues
          </div>
        </div>

        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 flex flex-col justify-center">
          <div className="text-2xl font-bold text-white mb-2">
            {issues.filter((i) => i.severity === "warning").length}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" /> Warnings
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Issues Detected</h3>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : issues.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-white">All Good!</h3>
            <p className="text-gray-400">Your content is optimized.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-shrink-0 mt-1 md:mt-0">
                  {issue.severity === "critical" ? (
                    <AlertCircle className="text-red-400" />
                  ) : (
                    <AlertTriangle className="text-yellow-400" />
                  )}
                </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    addToast(`Fixing: ${issue.postTitle}...`, "info");
                    const success = await seoService.fixIssue(issue);
                    if (success) {
                        addToast("Fixed successfully!", "success");
                        // Refresh
                        setIssues(prev => prev.filter(i => i.id !== issue.id));
                        setScore(seoService.calculateHealthScore(issues.filter(i => i.id !== issue.id), totalPosts));
                    } else {
                        addToast("Failed to auto-fix. Try manual edit.", "error");
                        navigate(`/admin/posts/edit/${issue.postId}`);
                    }
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Fix Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOHealthPage;
