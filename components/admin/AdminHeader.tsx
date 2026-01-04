import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { ChevronDown, LogOut, User, Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <header className="flex items-center justify-between px-8 h-24 bg-navy-900 border-b border-white/5 relative z-10">
      <div className="flex items-center gap-6">
        <div className="relative group hidden lg:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search admin..."
            className="bg-navy-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-gold/30 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="text-gray-400 hover:text-gold transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full ring-2 ring-navy-900 animate-pulse"></span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-navy-800 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 bg-navy-900/50 flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-gold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link || "#"}
                      onClick={() => {
                        markAsRead(n.id);
                        setNotificationsOpen(false);
                      }}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full ${
                            n.type === "comment"
                              ? "bg-blue-500"
                              : n.type === "newsletter"
                              ? "bg-green-500"
                              : "bg-gold"
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm text-gray-200 leading-snug">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-white/5"></div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-white/5 transition-all"
          >
            <div className="relative">
              <img
                src={user?.avatarUrl}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/5"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-navy-900 rounded-full"></div>
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-bold text-white leading-none mb-1">
                {user?.name}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Administrator
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-navy-800 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 mb-2 bg-navy-900/50">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">
                  Signed in as
                </div>
                <div className="text-sm text-gold truncate">{user?.email}</div>
              </div>

              <Link
                to="/admin/profile"
                className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={18} className="mr-3 text-gray-500" /> My Profile
              </Link>

              <div className="h-px bg-white/5 my-2"></div>

              <button
                onClick={logout}
                className="w-full text-left flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} className="mr-3" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
