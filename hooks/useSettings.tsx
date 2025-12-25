import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteSettings } from '../types';
import { settingsService } from '../services/settingsService';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const applySettingsToDOM = (settings: SiteSettings) => {
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    document.documentElement.style.setProperty('--font-primary', settings.primaryFont.split(',')[0]);
    document.documentElement.style.setProperty('--font-secondary', settings.secondaryFont.split(',')[0]);
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const fetchedSettings = await settingsService.getSettings();
        setSettings(fetchedSettings);
        applySettingsToDOM(fetchedSettings);
      } catch (error) {
        console.error("Failed to load site settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  
  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    if(!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    applySettingsToDOM(updated);
    await settingsService.updateSettings(updated);
  }

  const value = { settings, loading, updateSettings };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};