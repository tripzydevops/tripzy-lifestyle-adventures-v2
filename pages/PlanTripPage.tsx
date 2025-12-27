import React, { useState } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { aiService } from "../services/aiService";
import {
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  Send,
  LoaderCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import { useLanguage } from "../localization/LanguageContext";

const PlanTripPage = () => {
  const { t, language } = useLanguage();
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("3");
  const [itinerary, setItinerary] = useState<{
    text: string;
    sources: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsLoading(true);
    setItinerary(null);
    try {
      // Use the nearby attractions service which already leverages Maps grounding
      // We pass a more specific prompt for a full itinerary
      const result = await aiService.getNearbyAttractions(
        language === "tr"
          ? `${destination} için ${duration} günlük detaylı bir gezi planı oluştur. Her gün için kahvaltı, sabah aktivitesi, öğle yemeği, öğlen sonrası aktivitesi ve akşam yemeği öner.`
          : `Create a detailed ${duration}-day itinerary for ${destination}. Suggest breakfast, morning activity, lunch, afternoon activity, and dinner for each day.`,
        undefined,
        undefined
      );
      setItinerary(result);
    } catch (error) {
      console.error("Trip planning failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="AI Trip Planner"
        description="Plan your next adventure in seconds with our AI-powered travel itinerary generator."
      />
      <Header />
      <main className="flex-grow bg-navy-950 pb-20">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden border-b border-white/5"
          style={{
            background:
              "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gold/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
          </div>
          <div className="container mx-auto max-w-4xl text-center relative z-10 py-16 px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 mb-6 backdrop-blur-sm">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-sm font-semibold uppercase tracking-wider text-white">
                {t.tripPlanner.badge}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight text-white">
              {t.tripPlanner.title}{" "}
              <span className="text-amber-400 italic">
                {language === "tr" ? "maceranız" : "adventure"}
              </span>{" "}
              {language === "tr" ? "nereye götürecek?" : "take you?"}
            </h1>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              {t.tripPlanner.subtitle}
            </p>

            <form
              onSubmit={handlePlanTrip}
              className="bg-navy-900/50 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto mt-12 transition-all hover:border-gold/30 group"
            >
              <div className="flex-grow flex items-center px-6 py-2">
                <MapPin
                  className="text-gold mr-3 group-hover:scale-110 transition-transform"
                  size={20}
                />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Tokyo, Japan"
                  className="w-full bg-transparent py-3 text-white focus:outline-none placeholder-gray-500 font-medium text-lg"
                  required
                />
              </div>
              <div className="flex items-center px-6 py-2 border-l border-white/10">
                <Calendar className="text-gold mr-3" size={20} />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-transparent py-3 text-white focus:outline-none font-medium cursor-pointer text-lg appearance-none pr-4"
                >
                  <option value="1" className="bg-navy-900 text-white">
                    1 Day
                  </option>
                  <option value="3" className="bg-navy-900 text-white">
                    3 Days
                  </option>
                  <option value="5" className="bg-navy-900 text-white">
                    5 Days
                  </option>
                  <option value="7" className="bg-navy-900 text-white">
                    7 Days
                  </option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shrink-0 disabled:bg-navy-700 text-navy-950 shadow-xl hover:shadow-gold/20 active:scale-95"
                style={{
                  background: isLoading
                    ? "#475569"
                    : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                }}
              >
                {isLoading ? (
                  <LoaderCircle size={22} className="animate-spin" />
                ) : (
                  <Send size={22} />
                )}
                {isLoading ? "Planning..." : "Generate Itinerary"}
              </button>
            </form>
          </div>
        </section>

        {/* Itinerary Display */}
        <section className="container mx-auto max-w-6xl px-4 -mt-10">
          {!itinerary && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
              {[
                {
                  icon: Compass,
                  title: "Local Insights",
                  desc: "Hidden gems suggested by real-time web searches.",
                },
                {
                  icon: MapPin,
                  title: "Map Grounding",
                  desc: "Direct links to verified Google Maps locations.",
                },
                {
                  icon: Sparkles,
                  title: "Personalized",
                  desc: "Tailored day-by-day flows for your time frame.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-navy-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/5 flex flex-col items-center text-center hover:bg-navy-800 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="bg-navy-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 text-center border border-white/10">
              <div className="animate-bounce mb-6 inline-block">
                <Compass size={64} className="text-gold opacity-50" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Building your dream trip...
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Gemini is currently cross-referencing maps, reviews, and latest
                travel guides to find the best spots in {destination}.
              </p>
              <div className="mt-8 flex justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          )}

          {itinerary && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-navy-800 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
                  <div className="bg-gradient-to-r from-navy-900 to-navy-700 p-6 text-white border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold font-serif">
                        Your {duration}-Day Trip to {destination}
                      </h2>
                      <p className="text-gray-100 text-sm mt-1">
                        Generated by Gemini Intelligence
                      </p>
                    </div>
                    <Sparkles size={32} className="opacity-20" />
                  </div>
                  <div className="p-8">
                    <div className="prose prose-invert prose-blue max-w-none whitespace-pre-wrap text-gray-300 leading-relaxed font-sans">
                      {itinerary.text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-navy-800 rounded-3xl shadow-xl p-6 border border-white/10 sticky top-24">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-gold" />
                    Verified Locations
                  </h3>
                  <div className="space-y-4">
                    {itinerary.sources.filter((s) => s.maps).length > 0 ? (
                      itinerary.sources.map(
                        (source, i) =>
                          source.maps && (
                            <div
                              key={i}
                              className="group p-4 bg-navy-900/50 rounded-2xl hover:bg-gold/5 transition-colors border border-transparent hover:border-gold/20"
                            >
                              <h4 className="font-bold text-white text-sm group-hover:text-gold transition-colors">
                                {source.maps.title}
                              </h4>
                              <a
                                href={source.maps.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold mt-2"
                              >
                                View on Google Maps <ExternalLink size={12} />
                              </a>
                            </div>
                          )
                      )
                    ) : (
                      <div className="p-8 text-center bg-navy-900/30 rounded-2xl border border-dashed border-white/10">
                        <Info
                          size={32}
                          className="mx-auto text-navy-400 mb-2"
                        />
                        <p className="text-xs text-navy-400">
                          Search grounded locations will appear here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">
                      Travel Tip
                    </p>
                    <div className="bg-gold/10 p-4 rounded-xl text-xs text-gold-light leading-normal border border-gold/20">
                      Always check local opening hours as they may vary
                      seasonally. This itinerary is live-generated based on
                      current top-rated data.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PlanTripPage;
