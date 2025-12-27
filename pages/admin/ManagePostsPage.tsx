import React, { useState, useEffect, useCallback } from "react";
// FIX: Ensure react-router-dom import is correct.
import { Link } from "react-router-dom";
import { Post, User } from "../../types";
import { postService } from "../../services/postService";
import { userService } from "../../services/userService";
import Spinner from "../../components/common/Spinner";
import { PlusCircle, Search, Filter, FileText } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import PostTableRow from "../../components/admin/PostTableRow";

const ManagePostsPage = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
      addToast(t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getUserName = useCallback(
    (authorId: string) => {
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

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            {t("admin.managePosts")}
          </h1>
          <p className="text-gray-400 text-sm">
            Total of {posts.length} stories published in the Tripzy database.
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
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
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
    </div>
  );
};

export default ManagePostsPage;
