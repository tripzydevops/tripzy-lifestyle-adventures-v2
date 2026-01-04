import { supabase } from "../lib/supabase";

export const exportService = {
  /**
   * Fetches all posts from the blog.posts table and triggers a JSON download.
   */
  async exportPosts() {
    const { data: posts, error } = await supabase
      .schema("blog")
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    this.downloadJSON(
      posts,
      `tripzy_posts_backup_${new Date().toISOString().split("T")[0]}.json`
    );
    return posts.length;
  },

  /**
   * Fetches all comments and triggers a JSON download.
   */
  async exportComments() {
    const { data: comments, error } = await supabase
      .schema("blog")
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    this.downloadJSON(
      comments,
      `tripzy_comments_backup_${new Date().toISOString().split("T")[0]}.json`
    );
    return comments.length;
  },

  /**
   * Fetches all subscribers and triggers a JSON download.
   */
  async exportSubscribers() {
    const { data: subscribers, error } = await supabase
      .schema("blog")
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) throw error;

    this.downloadJSON(
      subscribers,
      `tripzy_subscribers_backup_${new Date().toISOString().split("T")[0]}.json`
    );
    return subscribers.length;
  },

  /**
   * Fetches the entire media library metadata.
   */
  async exportMediaManifest() {
    const { data: media, error } = await supabase
      .schema("blog")
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    this.downloadJSON(
      media,
      `tripzy_media_manifest_${new Date().toISOString().split("T")[0]}.json`
    );
    return media.length;
  },

  /**
   * Helper to trigger a browser download of a JSON object.
   */
  downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
