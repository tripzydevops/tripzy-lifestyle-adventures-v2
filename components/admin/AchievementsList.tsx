import React, { useState, useEffect } from "react";
import { Achievement, UserAchievement } from "../../types";
import {
  Trophy,
  Star,
  Medal,
  Lock,
  Zap,
  MessageCircle,
  Map,
} from "lucide-react";

interface AchievementsListProps {
  userAchievements: UserAchievement[];
  allAchievements: Achievement[];
  loading?: boolean;
}

const getIcon = (iconName: string, size = 20) => {
  switch (iconName) {
    case "Star":
      return <Star size={size} />;
    case "Zap":
      return <Zap size={size} />;
    case "MessageCircle":
      return <MessageCircle size={size} />;
    case "Map":
      return <Map size={size} />;
    default:
      return <Trophy size={size} />;
  }
};

const AchievementsList: React.FC<AchievementsListProps> = ({
  userAchievements,
  allAchievements,
  loading,
}) => {
  if (loading) {
    return (
      <div className="text-gray-400 text-sm animate-pulse">
        Loading achievements...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allAchievements.map((achievement) => {
        const userAchievement = userAchievements.find(
          (ua) => ua.achievement.id === achievement.id
        );
        const unlocked = !!userAchievement;

        return (
          <div
            key={achievement.id}
            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
              unlocked
                ? "bg-navy-800 border-gold/30 shadow-lg shadow-gold/5"
                : "bg-navy-900/50 border-white/5 opacity-60 grayscale hover:opacity-80"
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                unlocked ? "bg-gold text-navy-950" : "bg-white/10 text-gray-400"
              }`}
            >
              {unlocked ? getIcon(achievement.icon) : <Lock size={20} />}
            </div>
            <div>
              <h4
                className={`font-bold text-sm ${
                  unlocked ? "text-white" : "text-gray-400"
                }`}
              >
                {achievement.name}
              </h4>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                {achievement.description}
              </p>
              {unlocked && (
                <div className="mt-2 text-[10px] text-gold font-bold flex items-center gap-1">
                  <Star size={10} /> +{achievement.xpReward} XP Earned
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsList;
