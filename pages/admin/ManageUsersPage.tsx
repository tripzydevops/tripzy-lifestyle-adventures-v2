import React, { useState, useEffect } from "react";
import { User, UserRole } from "../../types";
import { userService } from "../../services/userService";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import { Users, Shield, User as UserIcon, Mail, Settings } from "lucide-react";

const ManageUsersPage = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await userService.getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        addToast("Failed to fetch users.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [addToast]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await userService.updateUser(userId, { role: newRole });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      addToast("User role updated!", "success");
    } catch (error) {
      addToast("Failed to update user role.", "error");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Administrator:
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case UserRole.Editor:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case UserRole.Author:
        return "bg-gold/20 text-gold border-gold/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Users size={32} className="text-gold" />
            {t("admin.manageUsers") || "Manage Community"}
          </h1>
          <p className="text-gray-400 text-sm">
            Total of {users.length} unique travelers and administrators across
            the Tripzy ecosystem.
          </p>
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
                    {t("admin.user") || "User"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.email") || "Email Identity"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.role") || "Access Level"}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("admin.actions") || "Control"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            className="h-12 w-12 rounded-2xl object-cover border border-white/10"
                            src={user.avatarUrl}
                            alt={user.name}
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 p-1 rounded-lg border border-navy-950 ${
                              getRoleBadgeColor(user.role).split(" ")[0]
                            }`}
                          >
                            {user.role === UserRole.Administrator ? (
                              <Shield size={10} />
                            ) : (
                              <UserIcon size={10} />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                        <Mail size={14} className="text-navy-600" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="relative group">
                          <Settings
                            size={18}
                            className="text-gray-500 hover:text-gold transition-colors cursor-pointer"
                          />
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-navy-800 border border-white/10 rounded-xl p-2 shadow-2xl z-50 min-w-[160px]">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest p-2 border-b border-white/5 mb-1">
                              Update Authority
                            </p>
                            <button
                              onClick={() =>
                                handleRoleChange(
                                  user.id,
                                  UserRole.Administrator
                                )
                              }
                              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
                            >
                              Administrator{" "}
                              <Shield size={12} className="text-purple-400" />
                            </button>
                            <button
                              onClick={() =>
                                handleRoleChange(user.id, UserRole.Editor)
                              }
                              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
                            >
                              Editor{" "}
                              <Shield size={12} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() =>
                                handleRoleChange(user.id, UserRole.Author)
                              }
                              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
                            >
                              Author{" "}
                              <UserIcon size={12} className="text-gold" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;
