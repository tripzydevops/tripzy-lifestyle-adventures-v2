import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Image,
  UploadCloud,
  ChevronRight,
  Bot,
  Mail,
  MessageSquare,
  Activity,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { SITE_NAME } from "../../constants";

const AdminSidebar = () => {
  const { isAdmin, isEditor, isAuthor } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 mt-2 rounded-xl transition-all duration-300 group ${
      isActive
        ? "bg-gold text-navy-950 font-bold shadow-lg shadow-gold/20"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="hidden md:flex flex-col w-72 bg-navy-900 border-r border-white/5 shrink-0 h-full relative z-20">
      <div className="flex items-center px-8 h-24 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white font-serif tracking-tight">
          Tripzy <span className="text-gold">Adventures</span>
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">
          Main Menu
        </div>
        <nav className="space-y-1">
          <NavLink to="/admin/dashboard" className={getNavLinkClass}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="mx-4 flex-grow text-sm">Dashboard</span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </NavLink>

          <NavLink to="/admin/posts" className={getNavLinkClass}>
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="mx-4 flex-grow text-sm">Posts</span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </NavLink>

          <NavLink to="/admin/ai-studio" className={getNavLinkClass}>
            <Bot className="w-5 h-5 flex-shrink-0" />
            <span className="mx-4 flex-grow text-sm">AI Studio</span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </NavLink>

          {(isAdmin || isEditor) && (
            <>
              <div className="pt-6 pb-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">
                  Marketing
                </div>
              </div>
              <NavLink
                to="/admin/newsletter-campaigns"
                className={getNavLinkClass}
              >
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="mx-4 flex-grow text-sm">Campaigns</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>
              <NavLink to="/admin/subscribers" className={getNavLinkClass}>
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="mx-4 flex-grow text-sm">Subscribers</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>
            </>
          )}

          {(isAdmin || isEditor) && (
            <NavLink to="/admin/comments" className={getNavLinkClass}>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span className="mx-4 flex-grow text-sm">Comments</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </NavLink>
          )}

          <div className="pt-6 pb-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">
              Resources
            </div>
          </div>

          {(isAdmin || isEditor || isAuthor) && (
            <NavLink to="/admin/media" className={getNavLinkClass}>
              <Image className="w-5 h-5 flex-shrink-0" />
              <span className="mx-4 flex-grow text-sm">Media Library</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </NavLink>
          )}

          {(isAdmin || isEditor) && (
            <NavLink to="/admin/import" className={getNavLinkClass}>
              <UploadCloud className="w-5 h-5 flex-shrink-0" />
              <span className="mx-4 flex-grow text-sm">Import Cloud</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </NavLink>
          )}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">
                  Administration
                </div>
              </div>
              <NavLink to="/admin/users" className={getNavLinkClass}>
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="mx-4 flex-grow text-sm">Team Members</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>

              <NavLink to="/admin/seo-health" className={getNavLinkClass}>
                <Activity className="w-5 h-5 flex-shrink-0" />
                <span className="mx-4 flex-grow text-sm">SEO Health</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>

              <NavLink to="/admin/settings" className={getNavLinkClass}>
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="mx-4 flex-grow text-sm">Settings</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* User Mini Profile in Sidebar end */}
      <div className="p-6 border-t border-white/5 bg-navy-950/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">
            {isAdmin ? "A" : "T"}
          </div>
          <div>
            <div className="text-sm font-bold text-white">Admin Panel</div>
            <div className="text-[10px] text-gold uppercase tracking-widest leading-none mt-1">
              Version 2.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
