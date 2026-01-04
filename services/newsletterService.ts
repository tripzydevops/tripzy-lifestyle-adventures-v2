import { supabase } from "../lib/supabase";

export const newsletterService = {
  async subscribe(email: string): Promise<void> {
    const { data: existing, error: checkError } = await supabase
      .schema("blog")
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      throw new Error("This email is already subscribed.");
    }

    const { error } = await supabase
      .schema("blog")
      .from("newsletter_subscribers")
      .insert([{ email, source: "website" }]);

    if (error) {
      console.error("Supabase Error (subscribe):", error);
      throw error;
    }
  },

  async getAllSubscribers(): Promise<string[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_subscribed", true);

    if (error) {
      console.error("Supabase Error (getAllSubscribers):", error);
      return [];
    }

    return data.map((s) => s.email);
  },

  async getCampaigns() {
    const { data, error } = await supabase
      .schema("blog")
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((c) => ({
      id: c.id,
      subject: c.subject,
      contentHtml: c.content_html,
      status: c.status,
      sentAt: c.sent_at,
      recipientCount: c.recipient_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  async createCampaign(subject: string, contentHtml: string) {
    const { data, error } = await supabase
      .schema("blog")
      .from("newsletter_campaigns")
      .insert([{ subject, content_html: contentHtml }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCampaign(
    id: string,
    updates: { subject?: string; contentHtml?: string }
  ) {
    const dbUpdates: any = {};
    if (updates.subject) dbUpdates.subject = updates.subject;
    if (updates.contentHtml) dbUpdates.content_html = updates.contentHtml;

    const { error } = await supabase
      .schema("blog")
      .from("newsletter_campaigns")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw error;
  },

  async sendCampaign(id: string) {
    // 1. Mark as sending
    const { error: updateError } = await supabase
      .schema("blog")
      .from("newsletter_campaigns")
      .update({ status: "sending" })
      .eq("id", id);

    if (updateError) throw updateError;

    // 2. Fetch subscribers
    const subscribers = await this.getAllSubscribers();

    // 3. Simulate sending (Real integration would go here - Postmark/Sendgrid)
    // For now, we just pretend we sent it to everyone.
    // In a real app, this should be an Edge Function call to avoid timeouts.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Mark as sent
    const { error: completeError } = await supabase
      .schema("blog")
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: subscribers.length,
      })
      .eq("id", id);

    if (completeError) throw completeError;
  },
};
