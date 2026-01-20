import React, { useState, useEffect } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { X, Cookie, Check } from "lucide-react";

const CookieConsent = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("tripzy_cookie_consent");
    if (!consent) {
      // Small delay to make it feel less intrusive on immediate load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("tripzy_cookie_consent", "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("tripzy_cookie_consent", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-navy-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-navy-800 rounded-full items-center justify-center border border-white/5">
          <Cookie className="w-6 h-6 text-gold" />
        </div>

        <div className="flex-grow">
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2 md:hidden">
            <Cookie className="w-5 h-5 text-gold" /> Cookie Preferences
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            We use cookies to enhance your browsing experience, serve
            personalized ads or content, and analyze our traffic. By clicking
            "Accept All", you consent to our use of cookies. Read our{" "}
            <a href="/privacy" className="text-gold hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="flex flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gold text-navy-950 hover:bg-gold-light transition-all font-bold text-sm shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
