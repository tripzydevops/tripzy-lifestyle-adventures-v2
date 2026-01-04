import { Comment } from "../types";
import { supabase } from "../lib/supabase";
import { gamificationService } from "./gamificationService";

const mapCommentFromSupabase = (data: any): Comment => ({
  id: data.id,
  postId: data.post_id,
  authorName: data.author_name || "Anonymous",
  content: data.content,
  createdAt: data.created_at,
  isApproved: data.is_approved, // Add this to Comment type definition if needed, but for internal use here it's fine or we update type.
});

export const commentService = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (getCommentsByPostId):", error);
      return [];
    }

    return data.map(mapCommentFromSupabase);
  },

  async addComment(
    postId: string,
    authorName: string,
    content: string,
    userId?: string
  ): Promise<Comment> {
    const supabaseData = {
      post_id: postId,
      author_name: authorName,
      content: content,
      is_approved: false, // Default to false for moderation
      user_id: userId,
    };

    const { data, error } = await supabase
      .schema("blog")
      .from("comments")
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (addComment):", error);
      throw error;
    }

    return mapCommentFromSupabase(data);
  },

  async getPendingComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("comments")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (getPendingComments):", error);
      return [];
    }
    return data.map(mapCommentFromSupabase);
  },

  async approveComment(id: string): Promise<void> {
    // 1. Approve the comment
    const { data: comment, error: updateError } = await supabase
      .schema("blog")
      .from("comments")
      .update({ is_approved: true })
      .eq("id", id)
      .select("user_id")
      .single();

    if (updateError) throw updateError;

    // 2. Award XP if user exists
    if (comment?.user_id) {
      // Award 50 XP for authorized comment
      const { error: rpcError } = await supabase.rpc("award_xp", {
        user_id: comment.user_id,
        xp_amount: 50,
      });

      if (rpcError) console.error("Error awarding XP:", rpcError);

      // Award 'conversation-starter' achievement if it's their first approved comment
      await gamificationService.checkAndAwardAchievement(
        comment.user_id,
        "conversation-starter"
      );
    }
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .schema("blog")
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
