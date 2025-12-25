
import { SiteSettings } from '../types';
import { mockSiteSettings } from '../data/mockData';

let settings: SiteSettings = { ...mockSiteSettings };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const settingsService = {
  async getSettings(): Promise<SiteSettings> {
    await delay(200);
    return settings;
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    await delay(1000);
    settings = { ...settings, ...updates };
    // In a real app, you would persist this. Here we can simulate it.
    // This could also trigger a re-application of styles.
    return settings;
  },
};
