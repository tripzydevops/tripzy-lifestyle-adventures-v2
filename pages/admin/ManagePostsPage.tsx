import React, { useState, useEffect, useCallback } from "react";
// FIX: Ensure react-router-dom import is correct.
import { Link } from "react-router-dom";
import { Post, User } from "../../types";
import { postService } from "../../services/postService";
import { userService } from "../../services/userService";
import Spinner from "../../components/common/Spinner";
import {
  PlusCircle,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import PostTableRow from "../../components/admin/PostTableRow";

const ManagePostsPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const POSTS_PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // NOTE: We still fetch all users to map names.
      // Ideally, users should also be paginated or fetched by ID,
      // but users list is generally smaller than posts list.
      const [fetchedData, fetchedUsers] = await Promise.all([
        postService.getAdminPosts(
          currentPage,
          POSTS_PER_PAGE,
          searchQuery,
          selectedLang
        ),
        userService.getAllUsers(),
      ]);
        userService.getAllUsers(),
      ]);
      setPosts(fetchedData.posts);
      setTotalPages(fetchedData.totalPages);
      setUsers(fetchedUsers);
    } catch (error) {
      addToast(t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedLang, addToast, t]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const getUserName = useCallback(
    (authorId: string) => {
      // NOTE: This might return "Unknown" if the user list is paginated and the author
      // is not in the current first page of users.
      // ideally we should fetch authors for the posts we have.
      return users.find((u) => u.id === authorId)?.name || "Unknown";
    },
    [users]
  );

  const handleDelete = useCallback(
    async (postId: string) => {
      if (window.confirm(t("admin.deleteConfirm"))) {
        try {
          await postService.deletePost(postId);
          addToast(t("admin.deleteSuccess"), "success");
          fetchData();
        } catch (error) {
          addToast(t("common.error"), "error");
        }
      }
    },
    [addToast, fetchData, t]
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            {t("admin.managePosts")}
          </h1>
          <p className="text-gray-400 text-sm">
            {/* Since we do server pagination, specific total might need an extra count call or just use totalPages estimate */}
            Manage your published stories and drafts.
          </p>
        </div>
        <Link
          to="/admin/posts/new"
          className="bg-gold text-navy-950 px-6 py-3 rounded-xl font-bold flex items-center hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle size={20} className="mr-2" />
          {t("admin.newPost")}
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-navy-900/50 backdrop-blur-xl p-4 rounded-2xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder={t("common.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
          <Filter size={14} />
          Filters
        </div>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-navy-800/50 border border-white/5 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-gold/50 transition-colors"
        >
          <option value="all">All Languages</option>
          <option value="en">English (EN)</option>
          <option value="tr">Turkish (TR)</option>
        </select>
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.title")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.author")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.status")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.date")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostTableRow
                      key={post.id}
                      post={post}
                      authorName={getUserName(post.authorId)}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={48} className="text-navy-700" />
                        <p className="text-gray-500">{t("admin.noPosts")}</p>
                        <Link
                          to="/admin/posts/new"
                          className="text-gold font-bold hover:underline"
                        >
                          {t("admin.createFirst")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-navy-800 text-white disabled:opacity-50 hover:bg-navy-700 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-400 text-sm font-bold tracking-widest">
            PAGE {currentPage} OF {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-navy-800 text-white disabled:opacity-50 hover:bg-navy-700 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagePostsPage;
