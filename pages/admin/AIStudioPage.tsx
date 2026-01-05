// pages/admin/AIStudioPage.tsx
import React, { useState, useEffect } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { aiContentService } from "../../services/aiContentService";
import { GeneratedSocial, GeneratedVideoPrompt } from "../../types";
import { useToast } from "../../hooks/useToast";
import {
  Bot,
  Instagram,
  Twitter,
  Facebook,
  Zap,
  History,
  Copy,
  Check,
  Globe,
  Wand2,
  Layout,
  MessageSquare,
  Sparkles,
  X,
  Video,
  Clapperboard,
  BrainCircuit,
  Lightbulb,
} from "lucide-react";
import { TripzyClient } from "../../lib/tripzy-sdk/TripzyClient";
import { SupabaseMemoryAdapter } from "../../lib/tripzy-sdk/adapters/SupabaseAdapter";

type HistoryItem = {
  id: string;
  type: "social" | "titles" | "video";
  content: GeneratedSocial | string[] | GeneratedVideoPrompt;
  timestamp: number;
  topic: string;
  platform?: string;
};

const AIStudioPage = () => {
  const { language: appLanguage } = useLanguage();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "social" | "titles" | "video" | "history" | "agent"
  >("social");
  const [language, setLanguage] = useState<"en" | "tr">("en");

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("TRIPZY_AI_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Social Media State
  const [socialTarget, setSocialTarget] = useState("");
  const [socialContext, setSocialContext] = useState("");
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [generatedSocial, setGeneratedSocial] =
    useState<GeneratedSocial | null>(null);
  const [copied, setCopied] = useState(false);

  // Track last used platform for history
  const [lastPlatform, setLastPlatform] = useState("");

  // Video State
  const [videoTopic, setVideoTopic] = useState("");
  const [visualStyle, setVisualStyle] = useState(
    "Cinematic, 4K, Travel Documentary"
  );
  const [videoModel, setVideoModel] = useState<"runway" | "luma" | "kling">(
    "runway"
  );
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] =
    useState<GeneratedVideoPrompt | null>(null);

  // Title Suggestions State
  const [titleTopic, setTitleTopic] = useState("");
  const [titleContext, setTitleContext] = useState("");
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [tempKey, setTempKey] = useState("");

  // Agent State
  const [agentQuery, setAgentQuery] = useState("");
  const [agentAnalysis, setAgentAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAgentAnalysis = async () => {
    if (!agentQuery) return;
    setAnalyzing(true);
    try {
      // Initialize SDK on the fly for demo
      const memory = new SupabaseMemoryAdapter(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const apiKey =
        localStorage.getItem("TRIPZY_AI_KEY") ||
        import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        addToast("API Key Missing", "error");
        setAnalyzing(false);
        return;
      }

      const client = new TripzyClient({
        apiKey,
        memoryAdapter: memory,
        debug: true,
      });

      // Simulate a Cold Start (Zero Signals)
      const result = await client.brain.analyze(agentQuery, []);
      setAgentAnalysis(result);
      addToast("Agent Analysis Complete", "success");
    } catch (error) {
      console.error(error);
      addToast("Agent Failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast(
      language === "tr" ? "Panoya kopyalandı!" : "Copied to clipboard!",
      "success"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHistory = () => {
    let type: HistoryItem["type"] = "social";
    let content: any = generatedSocial;
    let topic = socialTarget;

    if (activeTab === "titles") {
      type = "titles";
      content = generatedTitles;
      topic = titleTopic;
    } else if (activeTab === "video") {
      type = "video";
      content = generatedVideo;
      topic = videoTopic;
    }

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type: type,
      content: content,
      timestamp: Date.now(),
      topic: topic,
      platform:
        activeTab === "social"
          ? lastPlatform
          : activeTab === "video"
          ? videoModel
          : undefined,
    };

    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem("TRIPZY_AI_HISTORY", JSON.stringify(updated));
    addToast(
      language === "tr" ? "Geçmişe kaydedildi" : "Saved to history",
      "success"
    );
  };

  const generateSocialContent = async (
    platform: "instagram" | "twitter" | "facebook"
  ) => {
    if (!socialTarget) {
      addToast(
        language === "tr" ? "Lütfen bir başlık girin" : "Please enter a title",
        "error"
      );
      return;
    }
    setGeneratingSocial(true);
    setLastPlatform(platform);
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
        language === "tr" ? "Başlıklar hazır!" : "Titles generated!",
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

  const generateVideoPrompt = async () => {
    if (!videoTopic) {
      addToast(
        language === "tr" ? "Lütfen bir konu girin" : "Please enter a topic",
        "error"
      );
      return;
    }
    setGeneratingVideo(true);
    try {
      const result = await aiContentService.generateVideoPrompts(
        videoTopic,
        visualStyle,
        videoModel
      );
      setGeneratedVideo(result);
      addToast(
        language === "tr" ? "Video komutları hazır!" : "Video prompts ready!",
        "success"
      );
    } catch (error) {
      addToast(
        language === "tr" ? "Bir hata oluştu" : "An error occurred",
        "error"
      );
    } finally {
      setGeneratingVideo(false);
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
      setTempKey("");
    }
  };

  const isConfigured = aiContentService.isConfigured();

  useEffect(() => {
    // Sync language with app language if needed, but allow local override
    if (appLanguage === "tr" && language === "en") setLanguage("tr");
  }, [appLanguage]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="text-gold animate-spin-slow" /> AI Studio
          </h1>
          <p className="text-gray-400">
            {language === "tr"
              ? "Gelişmiş içerik üretim laboratuvarı"
              : "Advanced content generation laboratory"}
          </p>
        </div>
        <div className="flex gap-2 bg-navy-900/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              language === "en"
                ? "bg-gold text-navy-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("tr")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              language === "tr"
                ? "bg-gold text-navy-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            TR
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
            id: "video",
            icon: <Video size={18} />,
            label: { en: "Video Director", tr: "Video Yönetmeni" },
          },
          {
            id: "history",
            icon: <History size={18} />,
            label: {
              en: `History (${history.length})`,
              tr: `Geçmiş (${history.length})`,
            },
          },
          {
            id: "agent",
            icon: <BrainCircuit size={18} />,
            label: { en: "Agent Simulation", tr: "Ajan Simülasyonu" },
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

            <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3 relative z-10">
              <Layout size={20} className="text-gold" />
              {activeTab === "social"
                ? language === "tr"
                  ? "Sosyal Medya Girdileri"
                  : "Social Media Inputs"
                : activeTab === "video"
                ? language === "tr"
                  ? "Video Parametreleri"
                  : "Video Parameters"
                : language === "tr"
                ? "Başlık Parametreleri"
                : "Title Parameters"}
            </h3>

            {activeTab === "agent" ? (
              <div className="space-y-4">
                <div className="p-4 bg-gold/10 border border-gold/20 rounded-2xl">
                  <h4 className="flex items-center gap-2 text-gold font-bold mb-2">
                    <Lightbulb size={16} />
                    Cold Start Simulation
                  </h4>
                  <p className="text-xs text-gray-400">
                    Test how Layer 2 (The Brain) handles a user with ZERO
                    history. It will infer lifestyle vibes and perform
                    cross-domain mapping from just a query.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Simulated User Query
                  </label>
                  <textarea
                    rows={4}
                    value={agentQuery}
                    onChange={(e) => setAgentQuery(e.target.value)}
                    placeholder="e.g. cheap authentic food in chaos"
                    className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all font-medium"
                  />
                </div>

                <button
                  onClick={handleAgentAnalysis}
                  disabled={analyzing || !agentQuery}
                  className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <BrainCircuit size={22} />
                  {analyzing ? "Reasoning..." : "Analyze Intent"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === "video" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {language === "tr"
                          ? "Video Konusu / Sahne"
                          : "Topic / Scene Description"}
                      </label>
                      <textarea
                        rows={5}
                        value={videoTopic}
                        onChange={(e) => setVideoTopic(e.target.value)}
                        placeholder={
                          language === "tr"
                            ? "Örn: Bali pirinç tarlalarında gün batımında yürüyen bir gezgin..."
                            : "Detailed scene description e.g., Traveler walking through rice terraces..."
                        }
                        className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700 resize-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {language === "tr" ? "Görsel Stil" : "Visual Style"}
                      </label>
                      <input
                        type="text"
                        value={visualStyle}
                        onChange={(e) => setVisualStyle(e.target.value)}
                        className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-navy-700 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Target AI Model
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["runway", "luma", "kling"] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setVideoModel(m)}
                            className={`py-3 px-2 rounded-xl text-sm font-bold capitalize border ${
                              videoModel === m
                                ? "bg-navy-800 border-gold text-white"
                                : "bg-navy-900 border-white/5 text-gray-400"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={generateVideoPrompt}
                      disabled={generatingVideo}
                      className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-pink-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                      <Clapperboard size={22} />
                      {language === "tr"
                        ? "Video Komutu Yaz"
                        : "Generate Prompt"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {language === "tr"
                          ? "Konu / Destinasyon"
                          : "Topic / Destination"}
                      </label>
                      <input
                        type="text"
                        value={
                          activeTab === "social" ? socialTarget : titleTopic
                        }
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
                        value={
                          activeTab === "social" ? socialContext : titleContext
                        }
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

                    {activeTab === "titles" || activeTab === "history" ? (
                      <button
                        onClick={generateTitleSuggestions}
                        disabled={generatingTitles}
                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-gold text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{
                          display: activeTab === "history" ? "none" : "flex",
                        }}
                      >
                        <Wand2 size={22} />
                        {language === "tr"
                          ? "Sihirli Başlıklar Üret"
                          : "Generate Magic Titles"}
                      </button>
                    ) : (
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
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-2">
          <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl h-full min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                <Sparkles size={20} className="text-gold animate-pulse" />
                {activeTab === "history"
                  ? language === "tr"
                    ? "Geçmiş Kayıtlar"
                    : "Generation History"
                  : language === "tr"
                  ? "Yapay Zeka Laboratuvarı Çıktısı"
                  : "AI Laboratory Output"}
              </h3>
              <div className="flex gap-2">
                {(generatedSocial ||
                  generatedTitles.length > 0 ||
                  generatedVideo) &&
                  activeTab !== "history" && (
                    <button
                      onClick={handleSaveToHistory}
                      className="px-4 py-2 bg-navy-800 border border-gold/30 text-gold rounded-xl font-bold hover:bg-gold hover:text-navy-950 transition-all text-sm flex items-center gap-2"
                    >
                      <History size={16} />
                      {language === "tr" ? "Geçmişe Kaydet" : "Save to History"}
                    </button>
                  )}
                {generatedSocial ||
                generatedTitles.length > 0 ||
                generatedVideo ? (
                  <button
                    onClick={() => {
                      setGeneratedSocial(null);
                      setGeneratedTitles([]);
                      setGeneratedVideo(null);
                    }}
                    className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
                  >
                    {language === "tr" ? "Temizle" : "Clear Result"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 relative z-10">
              {generatingSocial || generatingTitles || generatingVideo ? (
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
              ) : activeTab === "video" && generatedVideo ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-white/5 rounded-3xl p-8 relative">
                    <span className="absolute top-4 right-4 text-xs font-bold bg-gold/10 text-gold px-3 py-1 rounded-full border border-gold/20 uppercase">
                      {videoModel} Optimized
                    </span>

                    <div className="mb-6">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                        Main Prompt (Copy & Paste)
                      </label>
                      <div
                        className="p-4 bg-black/40 rounded-xl border border-white/10 text-gray-200 font-mono text-sm relative group cursor-pointer"
                        onClick={() => handleCopy(generatedVideo.prompt)}
                      >
                        {generatedVideo.prompt}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all text-gold">
                          <Copy size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                        Negative Prompt (To Avoid)
                      </label>
                      <div
                        className="p-4 bg-red-900/10 rounded-xl border border-red-500/10 text-gray-300 font-mono text-sm relative group cursor-pointer"
                        onClick={() =>
                          handleCopy(generatedVideo.negativePrompt)
                        }
                      >
                        {generatedVideo.negativePrompt}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all text-gold">
                          <Copy size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-navy-800 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">
                          Camera Movement
                        </div>
                        <div className="text-white font-medium">
                          {generatedVideo.cameraMovement}
                        </div>
                      </div>
                      <div className="p-4 bg-navy-800 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">
                          Settings
                        </div>
                        <div className="text-white font-medium">
                          {generatedVideo.modelSettings}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "agent" && agentAnalysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-800/50 p-6 rounded-2xl border border-white/5">
                      <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Inferred Vibe
                      </div>
                      <div className="text-xl text-gold font-serif">
                        {agentAnalysis.lifestyleVibe || "N/A"}
                      </div>
                    </div>
                    <div className="bg-navy-800/50 p-6 rounded-2xl border border-white/5">
                      <div className="text-xs text-gray-500 uppercase font-bold mb-2">
                        Confidence
                      </div>
                      <div className="text-xl text-cyan-400 font-bold">
                        {(agentAnalysis.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-navy-800/30 border border-white/5 rounded-2xl p-6">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-3">
                      Reasoning Logic
                    </div>
                    <p className="text-gray-200 italic">
                      "{agentAnalysis.reasoning}"
                    </p>
                  </div>

                  {agentAnalysis.constraints && (
                    <div className="bg-navy-800/30 border border-white/5 rounded-2xl p-6">
                      <div className="text-xs text-gray-500 uppercase font-bold mb-3">
                        Inferred Constraints
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agentAnalysis.constraints.map((c: string) => (
                          <span
                            key={c}
                            className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-500/30 rounded-lg text-sm"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-navy-800/30 border border-white/5 rounded-2xl p-6">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-3">
                      Cross-Domain Mapping (Keywords)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentAnalysis.keywords.map((k: string) => (
                        <span
                          key={k}
                          className="px-3 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 rounded-xl font-mono text-xs text-gray-400 break-all">
                    <span className="text-gray-600 block mb-1">
                      Generated Vector (First 10 Dims):
                    </span>
                    {JSON.stringify(agentAnalysis.searchVector?.slice(0, 10))}
                    ...
                  </div>
                </div>
              ) : activeTab === "history" ? (
                history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center text-gray-600 mb-4">
                      <History size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">
                      No Generation History
                    </h4>
                    <p className="text-gray-500 max-w-xs">
                      Your saved AI outcomes will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto h-[600px] custom-scrollbar pr-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-navy-800/30 border border-white/5 p-6 rounded-3xl hover:bg-navy-800/50 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span
                              className={`inline-block px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold mb-2 ${
                                item.type === "social"
                                  ? "bg-pink-500/10 text-pink-400"
                                  : item.type === "video"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-purple-500/10 text-purple-400"
                              }`}
                            >
                              {item.type === "social"
                                ? item.platform || "Social Media"
                                : item.type === "video"
                                ? `Video: ${item.platform}`
                                : "Title Ideas"}
                            </span>
                            <h4 className="font-bold text-white leading-tight">
                              {item.topic}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const updated = history.filter(
                                (h) => h.id !== item.id
                              );
                              setHistory(updated);
                              localStorage.setItem(
                                "TRIPZY_AI_HISTORY",
                                JSON.stringify(updated)
                              );
                            }}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {item.type === "social" && (
                          <div className="bg-navy-900/50 p-4 rounded-xl text-gray-300 text-sm whitespace-pre-wrap">
                            {(item.content as GeneratedSocial).caption}
                            <div className="mt-2 text-gold/80 flex flex-wrap gap-2 text-xs">
                              {(item.content as GeneratedSocial).hashtags?.map(
                                (h) => (
                                  <span key={h}>{h}</span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {item.type === "titles" && (
                          <div className="space-y-2">
                            {(item.content as string[]).map((t, i) => (
                              <div
                                key={i}
                                className="bg-navy-900/50 p-3 rounded-lg text-gray-300 text-sm flex gap-2"
                              >
                                <span className="text-gold font-bold">
                                  {i + 1}.
                                </span>{" "}
                                {t}
                              </div>
                            ))}
                          </div>
                        )}

                        {item.type === "video" && (
                          <div className="bg-navy-900/50 p-4 rounded-xl text-gray-300 text-sm font-mono">
                            <strong className="text-gold block mb-1">
                              PROMPT:
                            </strong>
                            {(item.content as GeneratedVideoPrompt).prompt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
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
                      : activeTab === "video"
                      ? "Describe your scene and get a pro-level prompt."
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

      {/* API Key Modal Overlay for AI Studio */}
      {!isConfigured && (
        <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-navy-900 border border-white/10 p-10 rounded-[40px] max-w-lg w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mt-32 pointer-events-none"></div>

            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500">
              <Bot size={44} />
            </div>

            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              {language === "tr"
                ? "API Anahtarı Gerekli"
                : "Secret Key Required"}
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {language === "tr"
                ? "Görünüşe göre Gemini API anahtarı Bulut (Vercel) ortamında tanımlanmamış. Hemen kullanmaya başlamak için geçici bir anahtar girebilirsiniz."
                : "The Gemini API key is not configured in your Vercel Environment. You can enter a temporary key below to unlock AI features in this browser."}
            </p>

            <div className="relative group mb-6">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-6 pr-12 py-4 bg-navy-800 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-gold/30 transition-all font-mono"
              />
              <button
                onClick={handleSaveKey}
                disabled={tempKey.length < 10}
                className="absolute right-2 top-2 bottom-2 px-6 bg-gold text-navy-950 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50"
              >
                {language === "tr" ? "Aktive Et" : "Unlock"} <Zap size={16} />
              </button>
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Globe size={14} />{" "}
              {language === "tr" ? "API anahtarım yok" : "I don't have a key"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudioPage;
