import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { SiteSettings } from '../../types';
import Spinner from '../../components/common/Spinner';
import { AVAILABLE_FONTS, AVAILABLE_COLORS } from '../../constants';

const SettingsPage = () => {
  const { settings, loading, updateSettings } = useSettings();
  const { addToast } = useToast();
  const [formState, setFormState] = useState<Partial<SiteSettings>>({ seo: {} });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
        ...prev,
        seo: {
            ...(prev.seo || {}),
            [name]: value,
        },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formState);
      addToast('Settings updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to update settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-8">
        
        {/* General Settings */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input type="text" name="siteName" id="siteName" value={formState.siteName || ''} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input type="text" name="tagline" id="tagline" value={formState.tagline || ''} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.primary.map(color => (
                  <div key={color} className="relative">
                    <input type="radio" id={`primary-${color}`} name="primaryColor" value={color} checked={formState.primaryColor === color} onChange={handleChange} className="sr-only peer" />
                    <label htmlFor={`primary-${color}`} style={{ backgroundColor: color }} className="block w-8 h-8 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 transition"></label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex flex-wrap gap-2">
                 {AVAILABLE_COLORS.secondary.map(color => (
                  <div key={color} className="relative">
                    <input type="radio" id={`secondary-${color}`} name="secondaryColor" value={color} checked={formState.secondaryColor === color} onChange={handleChange} className="sr-only peer" />
                    <label htmlFor={`secondary-${color}`} style={{ backgroundColor: color }} className="block w-8 h-8 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 transition"></label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                 {AVAILABLE_COLORS.accent.map(color => (
                  <div key={color} className="relative">
                    <input type="radio" id={`accent-${color}`} name="accentColor" value={color} checked={formState.accentColor === color} onChange={handleChange} className="sr-only peer" />
                    <label htmlFor={`accent-${color}`} style={{ backgroundColor: color }} className="block w-8 h-8 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 transition"></label>
                  </div>
                ))}
              </div>
            </div>
            {/* Fonts */}
            <div>
              <label htmlFor="primaryFont" className="block text-sm font-medium text-gray-700 mb-1">Primary Font (Headings)</label>
              <select name="primaryFont" id="primaryFont" value={formState.primaryFont || ''} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary">
                {AVAILABLE_FONTS.map(font => (
                    <option key={font.name} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="secondaryFont" className="block text-sm font-medium text-gray-700 mb-1">Secondary Font (Body)</label>
              <select name="secondaryFont" id="secondaryFont" value={formState.secondaryFont || ''} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary">
                 {AVAILABLE_FONTS.map(font => (
                    <option key={font.name} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
        
        {/* Social Media Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Social Media Sharing (Open Graph)</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ogTitle" className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
              <input type="text" name="ogTitle" id="ogTitle" value={formState.seo?.ogTitle || ''} onChange={handleSeoChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="ogDescription" className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
              <input type="text" name="ogDescription" id="ogDescription" value={formState.seo?.ogDescription || ''} onChange={handleSeoChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="ogImage" className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
              <input type="url" name="ogImage" id="ogImage" value={formState.seo?.ogImage || ''} onChange={handleSeoChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
              <p className="text-xs text-gray-500 mt-1">Provide a full URL for the image (e.g., https://...). Recommended size: 1200x630 pixels.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-800 transition disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;