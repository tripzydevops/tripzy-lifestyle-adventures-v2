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
  Trophy,
} from "lucide-react";

import AchievementsList from "../../components/admin/AchievementsList";
import { gamificationService } from "../../services/gamificationService";
import { Achievement, UserAchievement } from "../../types";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    setLoadingAchievements(true);
    try {
      const [all, earned] = await Promise.all([
        gamificationService.getAllAchievements(),
        user
          ? gamificationService.getUserAchievements(user.id)
          : Promise.resolve([]),
      ]);
      setAllAchievements(all);
      setUserAchievements(earned);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAchievements(false);
    }
  };

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

  const xp = user.xp || 0;
  const level = user.level || 1;
  const { percentage, currentLevelProgress, nextLevelReq } =
    gamificationService.getLevelProgress(xp, level);

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

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 space-y-8 relative overflow-hidden group"
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-gold/10 transition-colors duration-700"></div>

            <div className="flex flex-col items-center gap-4 relative z-10 text-center">
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

              <div>
                <h2 className="text-xl font-serif font-bold text-white">
                  {user.name}
                </h2>
                <div className="text-sm text-gray-400 mt-1">{user.email}</div>
                <div className="flex justify-center mt-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/20">
                    <Shield size={10} />
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {t("admin.profile.fullName")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {t("admin.profile.photoUrl")}
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-gold text-navy-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-gold/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : t("admin.profile.saveProfile")}
            </button>
          </form>
        </div>

        {/* Right Column: Gamification Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Level Progress */}
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Current Level</h3>
                <div className="text-4xl font-serif text-gold font-bold mt-1">
                  Level {level}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {Math.floor(currentLevelProgress)} / {nextLevelReq} XP
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">
                  To Next Level
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="h-4 bg-navy-950 rounded-full overflow-hidden border border-white/5 relative">
              <div
                className="h-full bg-gradient-to-r from-gold/80 to-gold transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="text-gold" size={20} />
              Achievements
            </h3>
            <AchievementsList
              allAchievements={allAchievements}
              userAchievements={userAchievements}
              loading={loadingAchievements}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
