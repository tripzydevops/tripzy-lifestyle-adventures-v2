// components/admin/AIGenerateModal.tsx
// AI-Powered Content Generation Modal for Tripzy Blog
import React, { useState } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { aiContentService } from "../../services/aiContentService";
import { GeneratePostParams, GeneratedPost } from "../../types";
import { useToast } from "../../hooks/useToast";
import {
  X,
  Sparkles,
  Loader2,
  Globe,
  MapPin,
  Users,
  FileText,
  Wand,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (post: GeneratedPost) => void;
}

const TRAVEL_STYLES = [
  { value: "Adventure", label: { en: "Adventure", tr: "Macera" }, icon: "🏔️" },
  { value: "Luxury", label: { en: "Luxury", tr: "Lüks" }, icon: "✨" },
  { value: "Budget", label: { en: "Budget", tr: "Bütçe Dostu" }, icon: "💰" },
  { value: "Cultural", label: { en: "Cultural", tr: "Kültürel" }, icon: "🏛️" },
  {
    value: "Food & Drink",
    label: { en: "Food & Drink", tr: "Yeme-İçme" },
    icon: "🍽️",
  },
  { value: "Family", label: { en: "Family", tr: "Aile" }, icon: "👨‍👩‍👧‍👦" },
  { value: "Solo", label: { en: "Solo", tr: "Solo" }, icon: "🎒" },
  { value: "Romantic", label: { en: "Romantic", tr: "Romantik" }, icon: "💕" },
  { value: "Wellness", label: { en: "Wellness", tr: "Wellness" }, icon: "🧘" },
] as const;

const WORD_COUNTS = [
  { value: 500, label: { en: "Short (500 words)", tr: "Kısa (500 kelime)" } },
  {
    value: 1000,
    label: { en: "Medium (1000 words)", tr: "Orta (1000 kelime)" },
  },
  { value: 1500, label: { en: "Long (1500 words)", tr: "Uzun (1500 kelime)" } },
  {
    value: 2000,
    label: { en: "Extended (2000 words)", tr: "Genişletilmiş (2000 kelime)" },
  },
] as const;

type GenerationStep =
  | "idle"
  | "researching"
  | "crafting"
  | "optimizing"
  | "polishing"
  | "complete"
  | "error";

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const { t, language: appLanguage } = useLanguage();
  const { addToast } = useToast();

  // Form state
  const [language, setLanguage] = useState<"en" | "tr">("en");
  const [destination, setDestination] = useState("");
  const [travelStyle, setTravelStyle] =
    useState<GeneratePostParams["travelStyle"]>("Cultural");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [wordCount, setWordCount] = useState<500 | 1000 | 1500 | 2000>(1000);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState("");

  const handleGenerate = async () => {
    if (!destination.trim()) {
      addToast(
        language === "tr"
          ? "Lütfen bir destinasyon girin"
          : "Please enter a destination",
        "error"
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStep("researching");

    try {
      // Simulate step progression for UX
      setTimeout(() => setGenerationStep("crafting"), 1500);
      setTimeout(() => setGenerationStep("optimizing"), 4000);
      setTimeout(() => setGenerationStep("polishing"), 6000);

      const params: GeneratePostParams = {
        destination: destination.trim(),
        language,
        travelStyle,
        targetAudience: targetAudience.trim() || undefined,
        keyPoints: keyPoints.trim()
          ? keyPoints.split(",").map((k) => k.trim())
          : undefined,
        wordCount,
      };

      const generatedPost = await aiContentService.generatePost(params);

      setGenerationStep("complete");

      // Small delay to show completion state
      setTimeout(() => {
        onGenerated(generatedPost);
        addToast(
          language === "tr"
            ? "✨ İçerik başarıyla oluşturuldu!"
            : "✨ Content generated successfully!",
          "success"
        );
        handleReset();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("AI Generation Error Full Object:", err);
      setGenerationStep("error");
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during API call. Please check your network or API key."
      );
      addToast(
        language === "tr"
          ? "İçerik oluşturulamadı"
          : "Failed to generate content",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveKey = () => {
    if (tempKey.trim().length > 10) {
      localStorage.setItem("TRIPZY_AI_KEY", tempKey.trim());
      addToast(
        language === "tr"
          ? "API Anahtarı tarayıcıya kaydedildi!"
          : "API Key saved to browser!",
        "success"
      );
      setTempKey(""); // Clear input
      // Page will re-render and isConfigured() will now be true
    }
  };

  const handleReset = () => {
    setDestination("");
    setTargetAudience("");
    setKeyPoints("");
    setWordCount(1000);
    setTravelStyle("Cultural");
    setGenerationStep("idle");
    setError(null);
  };

  const getStepStatus = (step: GenerationStep) => {
    const steps: GenerationStep[] = [
      "researching",
      "crafting",
      "optimizing",
      "polishing",
      "complete",
    ];
    const currentIndex = steps.indexOf(generationStep);
    const stepIndex = steps.indexOf(step);

    if (generationStep === "error") return "error";
    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  if (!isOpen) return null;

  const isConfigured = aiContentService.isConfigured();

  return (
    <div
      className="fixed inset-0 bg-navy-950/95 backdrop-blur-lg z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-white/10 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mb-32 pointer-events-none"></div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-6 md:p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-gold rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                {language === "tr"
                  ? "AI İçerik Üretici"
                  : "AI Content Generator"}
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                Powered by Gemini 2.0 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-navy-800 text-gray-400 hover:text-white rounded-xl hover:bg-navy-700 transition-colors"
          >
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {!isConfigured ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-400">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-3">
                API Key Required
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm">
                {language === "tr"
                  ? "Gemini API anahtarı Bulut ortamında (Vercel gibi) eksik görünüyor. Kalıcı çözüm için Vercel Dashboard'a ekleyin veya hemen kullanmak için aşağıya yapıştırın."
                  : "The Gemini API key is missing from your deployment environment. Add it to your Vercel Dashboard for a permanent fix, or paste it below to use it instantly in this browser."}
              </p>

              <div className="max-w-md mx-auto space-y-4">
                <div className="relative group">
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-6 pr-12 py-4 bg-navy-800/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700"
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={tempKey.length < 10}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-gold text-navy-950 rounded-xl font-bold text-xs disabled:opacity-50 transition-all"
                  >
                    {language === "tr" ? "Kaydet" : "Save"}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs">
                  <span className="text-gray-600">OR</span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline flex items-center gap-1 font-bold"
                  >
                    Get a new key <Globe size={12} />
                  </a>
                </div>
              </div>
            </div>
          ) : isGenerating || generationStep === "complete" ? (
            /* Generation Progress */
            <div className="py-8">
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-gold/20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                  {generationStep === "complete" ? (
                    <CheckCircle size={48} className="text-green-400" />
                  ) : generationStep === "error" ? (
                    <AlertCircle size={48} className="text-red-400" />
                  ) : (
                    <Loader2 size={48} className="text-gold animate-spin" />
                  )}
                  <div className="absolute inset-0 bg-purple-500/20 rounded-3xl animate-ping"></div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">
                  {generationStep === "complete"
                    ? language === "tr"
                      ? "İçerik Hazır!"
                      : "Content Ready!"
                    : generationStep === "error"
                    ? language === "tr"
                      ? "Bir Hata Oluştu"
                      : "An Error Occurred"
                    : language === "tr"
                    ? "İçerik Oluşturuluyor..."
                    : "Generating Content..."}
                </h3>
                <p className="text-gray-400">
                  {language === "tr"
                    ? `${destination} için premium seyahat içeriği hazırlanıyor`
                    : `Crafting premium travel content for ${destination}`}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="max-w-md mx-auto space-y-4">
                {[
                  {
                    step: "researching" as GenerationStep,
                    en: "Researching destination",
                    tr: "Destinasyon araştırılıyor",
                  },
                  {
                    step: "crafting" as GenerationStep,
                    en: "Crafting narrative",
                    tr: "Hikaye oluşturuluyor",
                  },
                  {
                    step: "optimizing" as GenerationStep,
                    en: "Optimizing for SEO",
                    tr: "SEO için optimize ediliyor",
                  },
                  {
                    step: "polishing" as GenerationStep,
                    en: "Final polish",
                    tr: "Son rötuşlar",
                  },
                ].map(({ step, en, tr }) => {
                  const status = getStepStatus(step);
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        status === "complete"
                          ? "bg-green-500/10 border-green-500/20"
                          : status === "active"
                          ? "bg-purple-500/10 border-purple-500/30"
                          : status === "error"
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-navy-800/30 border-white/5"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status === "complete"
                            ? "bg-green-500 text-white"
                            : status === "active"
                            ? "bg-purple-500 text-white"
                            : status === "error"
                            ? "bg-red-500 text-white"
                            : "bg-navy-700 text-gray-500"
                        }`}
                      >
                        {status === "complete" ? (
                          <CheckCircle size={16} />
                        ) : status === "active" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : status === "error" ? (
                          <AlertCircle size={16} />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          status === "complete" || status === "active"
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {language === "tr" ? tr : en}
                      </span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button
                    onClick={() => setGenerationStep("idle")}
                    className="mt-3 text-gold font-bold text-sm hover:underline"
                  >
                    {language === "tr" ? "Tekrar Dene" : "Try Again"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Input Form */
            <div className="space-y-6">
              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Globe size={14} />
                  {language === "tr" ? "İçerik Dili" : "Content Language"}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage("tr")}
                    className={`flex-1 py-4 rounded-2xl border font-bold transition-all flex items-center justify-center gap-3 ${
                      language === "tr"
                        ? "bg-gold text-navy-950 border-gold shadow-lg shadow-gold/20"
                        : "bg-navy-800/30 border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    🇹🇷 Türkçe
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`flex-1 py-4 rounded-2xl border font-bold transition-all flex items-center justify-center gap-3 ${
                      language === "en"
                        ? "bg-gold text-navy-950 border-gold shadow-lg shadow-gold/20"
                        : "bg-navy-800/30 border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={14} />
                  {language === "tr" ? "Destinasyon" : "Destination"} *
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={
                    language === "tr"
                      ? "örn: İstanbul, Türkiye"
                      : "e.g., Paris, France"
                  }
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-600"
                />
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {language === "tr" ? "Seyahat Stili" : "Travel Style"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TRAVEL_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setTravelStyle(style.value)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        travelStyle === style.value
                          ? "bg-purple-500/20 border-purple-500/40 text-white"
                          : "bg-navy-800/30 border-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="mr-1">{style.icon}</span>
                      {style.label[language]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Users size={14} />
                  {language === "tr"
                    ? "Hedef Kitle (İsteğe Bağlı)"
                    : "Target Audience (Optional)"}
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder={
                    language === "tr"
                      ? "örn: Genç profesyoneller, aileler"
                      : "e.g., Young professionals, couples"
                  }
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-600"
                />
              </div>

              {/* Key Points */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FileText size={14} />
                  {language === "tr"
                    ? "Önemli Noktalar (İsteğe Bağlı)"
                    : "Key Points (Optional)"}
                </label>
                <input
                  type="text"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder={
                    language === "tr"
                      ? "örn: Tarihi yerler, yerel mutfak, gece hayatı"
                      : "e.g., Historical sites, local food, nightlife"
                  }
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-600"
                />
                <p className="text-[10px] text-gray-500 ml-1">
                  {language === "tr"
                    ? "Virgülle ayırın"
                    : "Separate with commas"}
                </p>
              </div>

              {/* Word Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {language === "tr" ? "Makale Uzunluğu" : "Article Length"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WORD_COUNTS.map((wc) => (
                    <button
                      key={wc.value}
                      type="button"
                      onClick={() => setWordCount(wc.value)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        wordCount === wc.value
                          ? "bg-gold/20 border-gold/40 text-gold"
                          : "bg-navy-800/30 border-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {wc.label[language]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        {isConfigured && generationStep === "idle" && (
          <footer className="relative z-10 p-6 md:p-8 border-t border-white/5 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
            >
              {language === "tr" ? "İptal" : "Cancel"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={!destination.trim()}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-gold text-white rounded-2xl font-bold flex items-center gap-3 hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand size={20} />
              {language === "tr" ? "İçerik Oluştur" : "Generate Content"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default AIGenerateModal;
