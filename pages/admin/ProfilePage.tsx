import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import {
  User,
  Shield,
  Mail,
  Camera,
  Save,
  User as UserIcon,
} from "lucide-react";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({ name, avatarUrl });
      addToast(t("admin.saveSuccess"), "success");
    } catch (error) {
      addToast(t("common.error"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <UserIcon className="text-gold" />
            {t("admin.profile.title")}
          </h1>
          <p className="text-gray-400 text-sm">{t("admin.profile.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-navy-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 space-y-10 relative overflow-hidden group"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-gold/10 transition-colors duration-700"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group/avatar">
              <img
                src={avatarUrl || "https://i.pravatar.cc/150"}
                alt="Avatar Preview"
                className="w-32 h-32 rounded-3xl object-cover border-2 border-white/10 group-hover/avatar:border-gold/50 transition-all shadow-2xl"
              />
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                <Camera size={24} className="text-white" />
              </div>
            </div>

            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-serif font-bold text-white">
                {user.name}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={14} className="text-gold" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/20">
                  <Shield size={10} />
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-10 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                {t("admin.profile.fullName")}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="avatarUrl"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                {t("admin.profile.photoUrl")}
              </label>
              <input
                type="url"
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 relative z-10">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 bg-gold text-navy-950 rounded-2xl font-bold flex items-center gap-2 hover:shadow-2xl hover:shadow-gold/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving
                ? t("admin.settings.synchronizing")
                : t("admin.profile.saveProfile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
