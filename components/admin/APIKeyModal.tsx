import React, { useState } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { useToast } from "../../hooks/useToast";
import { AlertCircle, Globe, X, Sparkles } from "lucide-react";
import { aiContentService } from "../../services/aiContentService";

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const APIKeyModal: React.FC<APIKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [tempKey, setTempKey] = useState("");

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (tempKey.trim().length > 10) {
      localStorage.setItem("TRIPZY_AI_KEY", tempKey.trim());
      addToast(
        language === "tr"
          ? "API Anahtarı tarayıcıya kaydedildi!"
          : "API Key saved to browser!",
        "success"
      );
      // Verify it works immediately
      if (aiContentService.isConfigured()) {
        onSuccess();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-navy-950/95 backdrop-blur-lg z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-white/10 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mt-48 pointer-events-none"></div>

        <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-serif font-bold text-white">
              {language === "tr" ? "Yapay Zeka Kurulumu" : "AI Setup Required"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-navy-800 text-gray-400 hover:text-white rounded-lg hover:bg-navy-700 transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-8 text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <AlertCircle size={32} />
          </div>

          <p className="text-gray-300 mb-6 leading-relaxed">
            {language === "tr"
              ? "Gemini API anahtarı eksik. İçerik oluşturmak ve metin iyileştirmek için lütfen anahtarınızı girin."
              : "The Gemini API key is missing. Please enter your key to enable AI content generation and prose improvements."}
          </p>

          <div className="space-y-4">
            <div className="relative group text-left">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-20 py-3 bg-navy-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700"
              />
              <button
                onClick={handleSaveKey}
                disabled={tempKey.length < 10}
                className="absolute right-1 top-1 bottom-1 px-4 bg-gold text-navy-950 rounded-lg font-bold text-xs disabled:opacity-50 transition-all hover:bg-yellow-400"
              >
                {language === "tr" ? "Kaydet" : "Save"}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs pt-2">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline flex items-center gap-1 font-bold"
              >
                Get a free Gemini API key <Globe size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeyModal;
