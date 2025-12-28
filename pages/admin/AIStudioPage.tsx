// pages/admin/AIStudioPage.tsx
import React, { useState } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import {
  aiContentService,
  GeneratedSocial,
} from "../../services/aiContentService";
import { useToast } from "../../hooks/useToast";
import {
  Sparkles,
  Bot,
  Instagram,
  Twitter,
  Facebook,
  Zap,
  History,
  Plus,
  Copy,
  Check,
  Globe,
  Wand2,
  Layout,
  MessageSquare,
} from "lucide-react";

const AIStudioPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"social" | "titles" | "history">(
    "social"
  );
  const [language, setLanguage] = useState<"en" | "tr">("en");

  // Social Media State
  const [socialTarget, setSocialTarget] = useState("");
  const [socialContext, setSocialContext] = useState("");
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [generatedSocial, setGeneratedSocial] =
    useState<GeneratedSocial | null>(null);
  const [copied, setCopied] = useState(false);

  // Title Suggestions State
  const [titleTopic, setTitleTopic] = useState("");
  const [titleContext, setTitleContext] = useState("");
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast(
      language === "tr" ? "Panoya kopyalandı!" : "Copied to clipboard!",
      "success"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSocialContent = async (
    platform: "instagram" | "twitter" | "facebook"
  ) => {
    if (!socialTarget) {
      addToast(
        language === "tr" ? "Lütfen bir başlık girin" : "Please enters a title",
        "error"
      );
      return;
    }
    setGeneratingSocial(true);
    try {
      const result = await aiContentService.generateSocialContent(
        socialTarget,
        socialContext,
        platform
      );
      setGeneratedSocial(result);
      addToast(
        language === "tr" ? "İçerik hazır!" : "Content ready!",
        "success"
      );
    } catch (error) {
      addToast(
        language === "tr" ? "Bir hata oluştu" : "An error occurred",
        "error"
      );
    } finally {
      setGeneratingSocial(false);
    }
  };

  const generateTitleSuggestions = async () => {
    if (!titleTopic) {
      addToast(
        language === "tr" ? "Lütfen bir konu girin" : "Please enter a topic",
        "error"
      );
      return;
    }
    setGeneratingTitles(true);
    try {
      const result = await aiContentService.generateTitleSuggestions(
        titleContext,
        titleTopic
      );
      setGeneratedTitles(result);
      addToast(
        language === "tr" ? "Başlıklar hazır!" : "Titles ready!",
        "success"
      );
    } catch (error) {
      addToast(
        language === "tr" ? "Bir hata oluştu" : "An error occurred",
        "error"
      );
    } finally {
      setGeneratingTitles(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bot size={22} />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white tracking-tight">
              AI Studio
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-13">
            {language === "tr"
              ? "Tripzy için yapay zeka destekli içerik üretim merkezi"
              : "AI-powered content laboratory for Tripzy Travel"}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex bg-navy-900/50 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setLanguage("tr")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              language === "tr"
                ? "bg-gold text-navy-950 shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🇹🇷 TR
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              language === "en"
                ? "bg-gold text-navy-950 shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {[
          {
            id: "social",
            icon: <MessageSquare size={18} />,
            label: { en: "Social Content", tr: "Sosyal Medya" },
          },
          {
            id: "titles",
            icon: <Zap size={18} />,
            label: { en: "Title Wizard", tr: "Başlık Sihirbazı" },
          },
          {
            id: "history",
            icon: <History size={18} />,
            label: { en: "History", tr: "Geçmiş" },
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? "bg-navy-800 border-gold/50 text-white shadow-xl shadow-gold/5"
                : "bg-navy-900/30 border-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            {tab.icon}
            {tab.label[language]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all"></div>

            <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
              <Layout size={20} className="text-gold" />
              {activeTab === "social"
                ? language === "tr"
                  ? "Sosyal Medya Girdileri"
                  : "Social Media Inputs"
                : language === "tr"
                ? "Başlık Parametreleri"
                : "Title Parameters"}
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {language === "tr"
                    ? "Konu / Destinasyon"
                    : "Topic / Destination"}
                </label>
                <input
                  type="text"
                  value={activeTab === "social" ? socialTarget : titleTopic}
                  onChange={(e) =>
                    activeTab === "social"
                      ? setSocialTarget(e.target.value)
                      : setTitleTopic(e.target.value)
                  }
                  placeholder={
                    language === "tr"
                      ? "örn: Bali Seyahat Rehberi"
                      : "e.g., Bali Travel Guide"
                  }
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  {language === "tr"
                    ? "Ek İçerik veya Notlar"
                    : "Additional Context or Notes"}
                </label>
                <textarea
                  rows={6}
                  value={activeTab === "social" ? socialContext : titleContext}
                  onChange={(e) =>
                    activeTab === "social"
                      ? setSocialContext(e.target.value)
                      : setTitleContext(e.target.value)
                  }
                  placeholder={
                    language === "tr"
                      ? "Makale içeriği veya anahtar noktalar..."
                      : "Article content or key points..."
                  }
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700 resize-none font-medium h-[200px]"
                />
              </div>

              {activeTab === "social" ? (
                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button
                    onClick={() => generateSocialContent("instagram")}
                    disabled={generatingSocial}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Instagram size={20} />
                    {language === "tr"
                      ? "Instagram İçin Üret"
                      : "Generate for Instagram"}
                  </button>
                  <button
                    onClick={() => generateSocialContent("twitter")}
                    disabled={generatingSocial}
                    className="w-full py-4 bg-[#1DA1F2] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Twitter size={20} />
                    {language === "tr"
                      ? "Twitter İçin Üret"
                      : "Generate for Twitter"}
                  </button>
                  <button
                    onClick={() => generateSocialContent("facebook")}
                    disabled={generatingSocial}
                    className="w-full py-4 bg-[#4267B2] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-800/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Facebook size={20} />
                    {language === "tr"
                      ? "Facebook İçin Üret"
                      : "Generate for Facebook"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateTitleSuggestions}
                  disabled={generatingTitles}
                  className="w-full py-5 bg-gradient-to-r from-purple-500 to-gold text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Wand2 size={22} />
                  {language === "tr"
                    ? "Sihirli Başlıklar Üret"
                    : "Generate Magic Titles"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-2">
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl h-full min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                <Sparkles size={20} className="text-gold animate-pulse" />
                {language === "tr"
                  ? "Yapay Zeka Laboratuvarı Çıktısı"
                  : "AI Laboratory Output"}
              </h3>
              {generatedSocial || generatedTitles.length > 0 ? (
                <button
                  onClick={() => {
                    setGeneratedSocial(null);
                    setGeneratedTitles([]);
                  }}
                  className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
                >
                  {language === "tr" ? "Temizle" : "Clear Result"}
                </button>
              ) : null}
            </div>

            <div className="flex-1 relative z-10">
              {generatingSocial || generatingTitles ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center mb-6 relative">
                    <Zap size={40} className="text-gold animate-bounce" />
                    <div className="absolute inset-0 bg-gold/20 rounded-3xl animate-ping"></div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {language === "tr"
                      ? "Tripzy AI Hazırlıyor..."
                      : "Tripzy AI is Crafting..."}
                  </h4>
                  <p className="text-gray-400">
                    {language === "tr"
                      ? "En iyi sonuçlar için veri işleniyor"
                      : "Processing data for optimal results"}
                  </p>
                </div>
              ) : activeTab === "social" && generatedSocial ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="bg-navy-800/40 border border-white/5 rounded-3xl p-8 relative group">
                    <button
                      onClick={() => handleCopy(generatedSocial.caption)}
                      className="absolute top-6 right-6 p-2 bg-navy-700 text-gold rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-gold hover:text-navy-950"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-wrap">
                      {generatedSocial.caption}
                    </p>
                  </div>

                  {generatedSocial.hashtags && (
                    <div className="bg-navy-800/20 border border-white/5 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {language === "tr"
                            ? "Önerilen Hashtagler"
                            : "Suggested Hashtags"}
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              generatedSocial.hashtags?.join(" ") || ""
                            )
                          }
                          className="text-gold text-xs font-bold hover:underline"
                        >
                          {language === "tr" ? "Tümünü Kopyala" : "Copy All"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedSocial.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-navy-800 rounded-lg text-gold text-sm font-medium border border-gold/10"
                          >
                            #{tag.replace("#", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl flex items-center gap-3 text-gold text-sm">
                    <Zap size={16} />
                    <strong>
                      {language === "tr"
                        ? "Tahmini En İyi Paylaşım Zamanı"
                        : "Best Expected Post Time"}
                      :
                    </strong>
                    <span>{generatedSocial.suggestedPostTime}</span>
                  </div>
                </div>
              ) : activeTab === "titles" && generatedTitles.length > 0 ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                  {generatedTitles.map((title, idx) => (
                    <div
                      key={idx}
                      className="bg-navy-800/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-gold/30 hover:bg-navy-800/60 transition-all cursor-pointer"
                      onClick={() => handleCopy(title)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center text-gold font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-white text-lg font-medium">
                          {title}
                        </span>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-gold opacity-0 group-hover:opacity-100 transition-all">
                        <Copy size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : activeTab === "history" ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center text-gray-600 mb-4">
                    <History size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    No Generation History
                  </h4>
                  <p className="text-gray-500 max-w-xs">
                    Your recent AI laboratory activities will appear here for
                    future reference.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <div className="w-20 h-20 bg-navy-800 rounded-[32px] flex items-center justify-center mb-6">
                    <Bot size={40} className="text-gray-600" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {language === "tr"
                      ? "Tripzy AI Hazır"
                      : "Tripzy AI stays ready"}
                  </h4>
                  <p className="text-gray-500 max-w-sm">
                    {activeTab === "social"
                      ? language === "tr"
                        ? "Bir makale başlığı girin ve platform seçin"
                        : "Enter an article title and select a platform to begin."
                      : language === "tr"
                      ? "Bir konu girin ve sihirli başlıklar üretin"
                      : "Enter a topic and watch as we generate high-converting headlines."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudioPage;
