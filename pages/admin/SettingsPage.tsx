import React, { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import { SiteSettings } from "../../types";
import { exportService } from "../../services/exportService";
import Spinner from "../../components/common/Spinner";
import { AVAILABLE_FONTS, AVAILABLE_COLORS } from "../../constants";
import { Settings, Palette, Share2, Save, Globe, Type } from "lucide-react";

const SettingsPage = () => {
  const { settings, loading, updateSettings } = useSettings();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [formState, setFormState] = useState<Partial<SiteSettings>>({
    seo: {},
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
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
      addToast(t("admin.saveSuccess"), "success");
    } catch (error) {
      addToast(t("common.error"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-gold" />
            {t("admin.settings.title")}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("admin.settings.subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
            <Globe size={20} className="text-gold" />
            {t("admin.settings.branding")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label
                htmlFor="siteName"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                {t("admin.settings.platformName")}
              </label>
              <input
                type="text"
                name="siteName"
                id="siteName"
                value={formState.siteName || ""}
                onChange={handleChange}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="tagline"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                {t("admin.settings.tagline")}
              </label>
              <input
                type="text"
                name="tagline"
                id="tagline"
                value={formState.tagline || ""}
                onChange={handleChange}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Data Management Settings */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
            <Settings size={20} className="text-gold" />
            Backup & Export
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  const count = await exportService.exportPosts();
                  addToast(`Exported ${count} posts successfully`, "success");
                } catch {
                  addToast("Failed to export posts", "error");
                }
              }}
              className="px-6 py-4 bg-navy-800 border border-white/10 rounded-2xl text-white font-bold hover:bg-gold hover:text-navy-950 transition-all text-sm"
            >
              Export Posts (JSON)
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const count = await exportService.exportComments();
                  addToast(
                    `Exported ${count} comments successfully`,
                    "success"
                  );
                } catch {
                  addToast("Failed to export comments", "error");
                }
              }}
              className="px-6 py-4 bg-navy-800 border border-white/10 rounded-2xl text-white font-bold hover:bg-gold hover:text-navy-950 transition-all text-sm"
            >
              Export Comments
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const count = await exportService.exportSubscribers();
                  addToast(
                    `Exported ${count} subscribers successfully`,
                    "success"
                  );
                } catch {
                  addToast("Failed to export subscribers", "error");
                }
              }}
              className="px-6 py-4 bg-navy-800 border border-white/10 rounded-2xl text-white font-bold hover:bg-gold hover:text-navy-950 transition-all text-sm"
            >
              Export Subscribers
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const count = await exportService.exportMediaManifest();
                  addToast(`Exported ${count} media items`, "success");
                } catch {
                  addToast("Failed to export media manifest", "error");
                }
              }}
              className="px-6 py-4 bg-navy-800 border border-white/10 rounded-2xl text-white font-bold hover:bg-gold hover:text-navy-950 transition-all text-sm"
            >
              Export Media List
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
            <Palette size={20} className="text-gold" />
            {t("admin.settings.designSystem")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Colors */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                {t("admin.settings.primaryAccents")}
              </label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_COLORS.primary.map((color) => (
                  <div key={color} className="relative">
                    <input
                      type="radio"
                      id={`primary-${color}`}
                      name="primaryColor"
                      value={color}
                      checked={formState.primaryColor === color}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor={`primary-${color}`}
                      style={{ backgroundColor: color }}
                      className="block w-10 h-10 rounded-xl cursor-pointer peer-checked:ring-2 peer-checked:ring-offset-4 peer-checked:ring-gold transition-all hover:scale-110 active:scale-90 border border-white/10"
                    ></label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="space-y-2">
              <label
                htmlFor="primaryFont"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2"
              >
                <Type size={14} /> {t("admin.settings.typographyHeadings")}
              </label>
              <select
                name="primaryFont"
                id="primaryFont"
                value={formState.primaryFont || ""}
                onChange={handleChange}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all appearance-none"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option
                    key={font.name}
                    value={font.value}
                    className="bg-navy-900 text-white"
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="secondaryFont"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2"
              >
                <Type size={14} /> {t("admin.settings.typographyBody")}
              </label>
              <select
                name="secondaryFont"
                id="secondaryFont"
                value={formState.secondaryFont || ""}
                onChange={handleChange}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all appearance-none"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option
                    key={font.name}
                    value={font.value}
                    className="bg-navy-900 text-white"
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Social Media Sharing */}
        <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
            <Share2 size={20} className="text-gold" />
            {t("admin.settings.socialGraph")}
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="ogTitle"
                className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                {t("admin.settings.socialHeadline")}
              </label>
              <input
                type="text"
                name="ogTitle"
                id="ogTitle"
                value={formState.seo?.ogTitle || ""}
                onChange={handleSeoChange}
                className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label
                  htmlFor="ogDescription"
                  className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                >
                  {t("admin.settings.socialDesc")}
                </label>
                <input
                  type="text"
                  name="ogDescription"
                  id="ogDescription"
                  value={formState.seo?.ogDescription || ""}
                  onChange={handleSeoChange}
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="ogImage"
                  className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                >
                  {t("admin.settings.shareImageUrl")}
                </label>
                <input
                  type="url"
                  name="ogImage"
                  id="ogImage"
                  value={formState.seo?.ogImage || ""}
                  onChange={handleSeoChange}
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-10 py-4 bg-gold text-navy-950 rounded-2xl font-bold flex items-center gap-2 hover:shadow-2xl hover:shadow-gold/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving
              ? t("admin.settings.synchronizing")
              : t("admin.settings.commitChanges")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
