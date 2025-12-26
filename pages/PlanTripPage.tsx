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

const PlanTripPage = () => {
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
        `Create a detailed ${duration}-day itinerary for ${destination}. Suggest breakfast, morning activity, lunch, afternoon activity, and dinner for each day.`,
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
      <main className="flex-grow bg-gray-50 pb-20">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          </div>
          <div className="container mx-auto max-w-4xl text-center relative z-10 py-16 px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 mb-6 backdrop-blur-sm">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-sm font-semibold uppercase tracking-wider text-white">
                AI Powered Planning
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight text-white">
              Where will your next{" "}
              <span className="text-amber-400 italic">adventure</span> take you?
            </h1>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Our AI travel consultant uses real-time Google data to build the
              perfect day-by-day itinerary just for you.
            </p>

            <form
              onSubmit={handlePlanTrip}
              className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
            >
              <div className="flex-grow flex items-center px-4">
                <MapPin className="text-gray-400 mr-2" size={20} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Tokyo, Japan"
                  className="w-full py-3 text-gray-800 focus:outline-none placeholder-gray-400 font-medium"
                  required
                />
              </div>
              <div className="flex items-center px-4 border-l border-gray-100">
                <Calendar className="text-gray-400 mr-2" size={20} />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="py-3 text-gray-800 focus:outline-none bg-transparent font-medium cursor-pointer"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shrink-0 disabled:bg-gray-400 text-white shadow-lg"
                style={{
                  background: isLoading
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                }}
              >
                {isLoading ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
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
                  className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-bold text-neutral mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-200">
              <div className="animate-bounce mb-6 inline-block">
                <Compass size={64} className="text-primary opacity-20" />
              </div>
              <h2 className="text-2xl font-bold text-neutral mb-2">
                Building your dream trip...
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
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
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-primary to-blue-800 p-6 text-white flex items-center justify-between">
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
                    <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {itinerary.text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200 sticky top-24">
                  <h3 className="text-lg font-bold text-neutral mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    Verified Locations
                  </h3>
                  <div className="space-y-4">
                    {itinerary.sources.filter((s) => s.maps).length > 0 ? (
                      itinerary.sources.map(
                        (source, i) =>
                          source.maps && (
                            <div
                              key={i}
                              className="group p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                            >
                              <h4 className="font-bold text-neutral text-sm group-hover:text-primary transition-colors">
                                {source.maps.title}
                              </h4>
                              <a
                                href={source.maps.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2"
                              >
                                View on Google Maps <ExternalLink size={12} />
                              </a>
                            </div>
                          )
                      )
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Info
                          size={32}
                          className="mx-auto text-gray-300 mb-2"
                        />
                        <p className="text-xs text-gray-400">
                          Search grounded locations will appear here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">
                      Travel Tip
                    </p>
                    <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-900 leading-normal border border-amber-100">
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
