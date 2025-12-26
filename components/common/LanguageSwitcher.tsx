import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "../../localization/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "tr" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20 hover:border-white/30"
      aria-label="Toggle language"
      title={language === "en" ? "Türkçe'ye geç" : "Switch to English"}
    >
      <Languages size={18} />
      <span className="text-sm font-semibold uppercase">
        {language === "en" ? "TR" : "EN"}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
