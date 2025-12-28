import { SiteSettings } from '../types';
import { supabase } from '../lib/supabase';

// Helper to get a setting value
async function getSetting(key: string): Promise<any> {
  const { data, error } = await supabase
    .schema('blog')
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) return null;
  return data?.value;
}

// Helper to set a setting value
async function setSetting(key: string, value: any): Promise<void> {
  await supabase
    .schema('blog')
    .from('settings')
    .upsert({ key, value: JSON.stringify(value) });
}

export const settingsService = {
  async getSettings(): Promise<SiteSettings> {
    try {
      // Fetch all settings at once
      const { data, error } = await supabase
        .schema('blog')
        .from('settings')
        .select('key, value')
        .eq('is_public', true);

      if (error) {
        console.error('Supabase Error (getSettings):', error);
        // Return defaults
        return {
          siteName: 'Tripzy Lifestyle Adventures',
          tagline: 'Discover. Explore. Experience.',
          primaryColor: '#1e3a8a',
          secondaryColor: '#d4af37',
          accentColor: '#f59e0b',
          primaryFont: 'Inter',
          secondaryFont: 'Playfair Display',
          seo: {
            ogTitle: 'Tripzy Lifestyle Adventures',
            ogDescription: 'Your ultimate guide to lifestyle travel',
            ogImage: '',
          }
        };
      }

      // Convert key-value pairs to SiteSettings object
      const settings: any = {};
      data?.forEach(item => {
        settings[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
      });

      return {
        siteName: settings.site_name || 'Tripzy Lifestyle Adventures',
        tagline: settings.site_tagline || 'Discover. Explore. Experience.',
        primaryColor: settings.primary_color || '#1e3a8a',
        secondaryColor: settings.secondary_color || '#d4af37',
        accentColor: settings.accent_color || '#f59e0b',
        primaryFont: settings.primary_font || 'Inter',
        secondaryFont: settings.secondary_font || 'Playfair Display',
        seo: {
          ogTitle: settings.og_title || 'Tripzy Lifestyle Adventures',
          ogDescription: settings.meta_description || 'Your ultimate guide to lifestyle travel',
          ogImage: settings.og_image || '',
        }
      };
    } catch (err) {
      console.error('Error loading settings:', err);
      // Return defaults
      return {
        siteName: 'Tripzy Lifestyle Adventures',
        tagline: 'Discover. Explore. Experience.',
        primaryColor: '#1e3a8a',
        secondaryColor: '#d4af37',
        accentColor: '#f59e0b',
        primaryFont: 'Inter',
        secondaryFont: 'Playfair Display',
        seo: {
          ogTitle: 'Tripzy Lifestyle Adventures',
          ogDescription: 'Your ultimate guide to lifestyle travel',
          ogImage: '',
        }
      };
    }
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const settingsToUpdate: Array<{ key: string; value: any }> = [];

      if (updates.siteName) settingsToUpdate.push({ key: 'site_name', value: updates.siteName });
      if (updates.tagline) settingsToUpdate.push({ key: 'site_tagline', value: updates.tagline });
      if (updates.primaryColor) settingsToUpdate.push({ key: 'primary_color', value: updates.primaryColor });
      if (updates.secondaryColor) settingsToUpdate.push({ key: 'secondary_color', value: updates.secondaryColor });
      if (updates.accentColor) settingsToUpdate.push({ key: 'accent_color', value: updates.accentColor });
      if (updates.primaryFont) settingsToUpdate.push({ key: 'primary_font', value: updates.primaryFont });
      if (updates.secondaryFont) settingsToUpdate.push({ key: 'secondary_font', value: updates.secondaryFont });
      
      if (updates.seo) {
        if (updates.seo.ogTitle) settingsToUpdate.push({ key: 'og_title', value: updates.seo.ogTitle });
        if (updates.seo.ogDescription) settingsToUpdate.push({ key: 'meta_description', value: updates.seo.ogDescription });
        if (updates.seo.ogImage) settingsToUpdate.push({ key: 'og_image', value: updates.seo.ogImage });
      }

      // Upsert each setting
      for (const setting of settingsToUpdate) {
        await supabase
          .schema('blog')
          .from('settings')
          .upsert({
            key: setting.key,
            value: JSON.stringify(setting.value),
            updated_at: new Date().toISOString()
          });
      }

      // Return updated settings
      return await this.getSettings();
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  },
};
