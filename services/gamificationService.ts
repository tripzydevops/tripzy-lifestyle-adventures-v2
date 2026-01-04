import { supabase } from "../lib/supabase";
import { UserAchievement, Achievement } from "../types";

export const gamificationService = {
  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase.from("achievements").select("*");

    if (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }

    return data.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xp_reward,
    }));
  },

  /**
   * Get achievements for a specific user
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        earned_at,
        achievements (
          id, slug, name, description, icon, xp_reward
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user achievements:", error);
      return [];
    }

    return data.map((ua: any) => ({
      earnedAt: ua.earned_at,
      achievement: {
        id: ua.achievements.id,
        slug: ua.achievements.slug,
        name: ua.achievements.name,
        description: ua.achievements.description,
        icon: ua.achievements.icon,
        xpReward: ua.achievements.xp_reward,
      },
    }));
  },

  /**
   * Get user level progress
   */
  getLevelProgress(xp: number, level: number) {
    // Basic formula: Next level requires Level * 1000 XP
    // Or cumulative: XP = (Level^2)/2 * 100 ??
    // For now, let's assume a simple table or linear progression per level
    // Level 1: 0-100
    // Level 2: 101-300 (Need 200)
    // Level 3: 301-600 (Need 300)

    // Formula: Required XP for next level = Level * 100
    const xpForNextLevel = level * 100;
    // This is VERY simplified. In a real RPG, use a curve.

    // Total XP required to reach current level (cumulative sum of 1..Level-1 * 100)
    // Sum(1 to L-1) * 100 = (L-1)*L/2 * 100
    const xpAtCurrentLevelStart = (((level - 1) * level) / 2) * 100;
    const xpForNextLevelTotal = ((level * (level + 1)) / 2) * 100;

    const currentLevelProgress = xp - xpAtCurrentLevelStart;
    const nextLevelReq = xpForNextLevelTotal - xpAtCurrentLevelStart;

    const percentage = Math.min(
      100,
      Math.max(0, (currentLevelProgress / nextLevelReq) * 100)
    );

    return {
      currentLevelProgress,
      nextLevelReq,
      percentage,
    };
  },

  /**
   * Check if a user meets criteria for an achievement and award it if yes
   * @param userId User UUID
   * @param slug Achievement slug
   */
  async checkAndAwardAchievement(
    userId: string,
    slug: string
  ): Promise<boolean> {
    try {
      // 1. Check if user already has this achievement
      const { data: existing, error: checkError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq(
          "achievement_id",
          (
            supabase
              .from("achievements")
              .select("id")
              .eq("slug", slug)
              .single() as any
          ).id
        ); // This is a bit complex in one query, let's break it down.

      // Actually, let's fetch the achievement first
      const { data: achievement, error: achError } = await supabase
        .from("achievements")
        .select("id, xp_reward")
        .eq("slug", slug)
        .single();

      if (achError || !achievement) return false;

      const { data: hasIt, error: hasError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id)
        .maybeSingle();

      if (hasError) return false;
      if (hasIt) return false; // Already earned

      // 2. Award the achievement
      const { error: insertError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

      if (insertError) return false;

      // 3. Award the XP associated with the achievement
      await supabase.rpc("award_xp", {
        user_id: userId,
        xp_amount: achievement.xp_reward,
      });

      return true;
    } catch (err) {
      console.error("Error in checkAndAwardAchievement:", err);
      return false;
    }
  },
};
