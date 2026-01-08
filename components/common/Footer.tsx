import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SITE_NAME } from "../../constants";
import {
  Instagram,
  Twitter,
  Youtube,
  Mail,
  MapPin,
  ArrowRight,
  Heart,
} from "lucide-react";
import { newsletterService } from "../../services/newsletterService";

const TRIPZY_APP_URL =
  import.meta.env.VITE_TRIPZY_APP_URL || "https://tripzy.travel";

import { useToast } from "../../hooks/useToast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { addToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await newsletterService.subscribe(email);
      setIsSubscribed(true);
      setEmail("");
      addToast("Subscribed successfully!", "success");
    } catch (error) {
      console.error("Subscription failed:", error);
      addToast("Failed to subscribe. Please try again.", "error");
    }
  };

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: Instagram,
      href: "https://instagram.com/tripzy.travel",
      label: "Instagram",
    },
    {
      icon: Twitter,
      href: "https://twitter.com/tripzytravel",
      label: "Twitter",
    },
    {
      icon: Youtube,
      href: "https://youtube.com/@tripzytravel",
      label: "YouTube",
    },
  ];

  return (
    <footer className="bg-navy-950 border-t border-white/5">
      {/* Newsletter Section */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-serif text-white mb-3">
              Join the <span className="text-gold">Adventure</span>
            </h3>
            <p className="text-slate-400 mb-6">
              Get travel tips, exclusive deals, and inspiring stories delivered
              to your inbox.
            </p>

            {isSubscribed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400">
                ✓ Thanks for subscribing! Check your email for confirmation.
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-navy-800 border border-navy-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all flex items-center justify-center gap-2"
                >
                  Subscribe
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold font-serif text-gold">
                {SITE_NAME}
              </span>
            </Link>
            <p className="text-slate-400 text-sm mb-6">
              Your gateway to extraordinary travel experiences, inspiring
              stories, and insider tips from around the globe.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center text-slate-400 hover:bg-gold hover:text-navy-950 transition-all"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2">
              {["Home", "About", "Contact", "Plan a Trip"].map((item) => (
                <li key={item}>
                  <Link
                    to={
                      item === "Plan a Trip"
                        ? "/plan"
                        : `/${item.toLowerCase()}`
                    }
                    className="text-slate-400 hover:text-gold transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {[
                "Adventure",
                "Food & Travel",
                "Guides",
                "Lifestyle",
                "Culture",
                "Tips",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/category/${cat.toLowerCase().replace(/ & /g, "-")}`}
                    className="text-slate-400 hover:text-gold transition-colors text-sm"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tripzy App */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get the App</h4>
            <p className="text-slate-400 text-sm mb-4">
              Discover exclusive deals and discounts with Tripzy.
            </p>
            <a
              href={TRIPZY_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-4 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all text-sm"
            >
              <MapPin size={16} />
              Explore Tripzy
            </a>

            <div className="mt-6">
              <a
                href="mailto:hello@tripzy.travel"
                className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors text-sm"
              >
                <Mail size={16} />
                hello@tripzy.travel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm flex items-center gap-1">
              © {currentYear} {SITE_NAME}. Made with{" "}
              <Heart size={14} className="text-red-500" fill="currentColor" />{" "}
              for travelers.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-slate-500 hover:text-gold transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-slate-500 hover:text-gold transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/sitemap.xml"
                className="text-slate-500 hover:text-gold transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
