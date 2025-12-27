import React from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { SITE_NAME } from "../constants";
import SEO from "../components/common/SEO";
import { useLanguage } from "../localization/LanguageContext";
import { Globe, Users, BookOpen, Compass } from "lucide-react";

const AboutPage = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-navy-950">
      <SEO title={t("header.about")} description={t("footer.aboutText")} />
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent_50%)]"></div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900/50 border border-gold/20 rounded-full text-gold text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
              <Compass size={16} />
              {SITE_NAME}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-serif text-white mb-8">
              {t("about.title")}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t("footer.aboutText")}
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-t border-b border-white/5 bg-navy-900/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6">
                <div className="flex justify-center mb-4 text-gold opacity-50">
                  <Globe size={32} />
                </div>
                <div className="text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest">
                  {t("about.stats.destinations")}
                </div>
              </div>
              <div className="text-center p-6 border-x border-white/5">
                <div className="flex justify-center mb-4 text-gold opacity-50">
                  <Users size={32} />
                </div>
                <div className="text-4xl font-bold text-white mb-2">10k+</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest">
                  {t("about.stats.readers")}
                </div>
              </div>
              <div className="text-center p-6">
                <div className="flex justify-center mb-4 text-gold opacity-50">
                  <BookOpen size={32} />
                </div>
                <div className="text-4xl font-bold text-white mb-2">200+</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest">
                  {t("about.stats.guides")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-4 bg-gold/5 rounded-3xl blur-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop"
                alt="Adventure Map"
                className="rounded-3xl shadow-2xl relative z-10 border border-white/10"
              />
              {/* Floating element */}
              <div className="absolute -bottom-8 -right-8 bg-navy-800 p-6 rounded-2xl border border-white/10 shadow-2xl z-20 hidden md:block backdrop-blur-xl">
                <div className="text-gold font-bold text-lg mb-1">
                  Tripzy AI
                </div>
                <div className="text-gray-400 text-xs">
                  Autonomous Recommendations
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-gold flex items-center gap-3">
                  <span className="w-8 h-px bg-gold/50"></span>
                  {t("about.mission")}
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed italic">
                  "{t("about.missionText")}"
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                  <span className="w-8 h-px bg-white/20"></span>
                  {t("about.story")}
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  {t("about.storyText")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
