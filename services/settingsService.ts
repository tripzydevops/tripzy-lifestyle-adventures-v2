
import { SiteSettings } from '../types';
import { supabase } from '../lib/supabase';

const mapSettingsFromSupabase = (data: any): SiteSettings => ({
  siteName: data.site_name,
  tagline: data.tagline,
  primaryColor: data.primary_color,
  secondaryColor: data.secondary_color,
  accentColor: data.accent_color,
  primaryFont: data.primary_font,
  secondaryFont: data.secondary_font,
  seo: {
    ogTitle: data.og_title,
    ogDescription: data.og_description,
    ogImage: data.og_image,
  }
});

export const settingsService = {
  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*', { schema: 'blog' })
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('Supabase Error (getSettings):', error);
      // Fallback or re-throw
      throw error;
    }

    return mapSettingsFromSupabase(data);
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const supabaseUpdates: any = {};
    if (updates.siteName) supabaseUpdates.site_name = updates.siteName;
    if (updates.tagline) supabaseUpdates.tagline = updates.tagline;
    if (updates.primaryColor) supabaseUpdates.primary_color = updates.primaryColor;
    if (updates.secondaryColor) supabaseUpdates.secondary_color = updates.secondaryColor;
    if (updates.accentColor) supabaseUpdates.accent_color = updates.accentColor;
    if (updates.primaryFont) supabaseUpdates.primary_font = updates.primaryFont;
    if (updates.secondaryFont) supabaseUpdates.secondary_font = updates.secondaryFont;
    if (updates.seo) {
      if (updates.seo.ogTitle) supabaseUpdates.og_title = updates.seo.ogTitle;
      if (updates.seo.ogDescription) supabaseUpdates.og_description = updates.seo.ogDescription;
      if (updates.seo.ogImage) supabaseUpdates.og_image = updates.seo.ogImage;
    }
    
    supabaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('settings')
      .update(supabaseUpdates, { schema: 'blog' })
      .eq('id', 'default')
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (updateSettings):', error);
      throw error;
    }

    return mapSettingsFromSupabase(data);
  },
};
