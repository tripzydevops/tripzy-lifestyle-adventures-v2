import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SITE_NAME } from "../../constants";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  LogIn,
  Menu,
  X,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";
import SearchBar from "./SearchBar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../../localization/LanguageContext";

const TRIPZY_APP_URL =
  import.meta.env.VITE_TRIPZY_APP_URL || "https://tripzy.travel";

const Header = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Trigger "Island Mode" slightly earlier for better responsiveness
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  interface NavLinkProps {
    to: string;
    children: React.ReactNode;
    badge?: React.ReactNode;
  }

  const NavLink = ({ to, children, badge }: NavLinkProps) => (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 font-medium transition-all duration-300 px-3 py-1.5 rounded-full hover:bg-white/5 ${
        isActive(to) ? "text-gold" : "text-slate-300 hover:text-white"
      }`}
    >
      {children}
      {badge}
      {isActive(to) && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full shadow-[0_0_10px_var(--color-gold)]" />
      )}
    </Link>
  );

  const MobileNavLink = ({ to, children, badge }: NavLinkProps) => (
    <Link
      to={to}
      onClick={closeMenu}
      className={`text-2xl font-serif font-medium py-3 text-center flex items-center justify-center gap-2 transition-colors duration-200 ${
        isActive(to) ? "text-gold" : "text-white hover:text-gold"
      }`}
    >
      {children}
      {badge}
    </Link>
  );

  const AIBadge = () => (
    <span className="bg-gold/10 border border-gold/20 text-gold text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.1)]">
      <Sparkles size={10} />
      AI
    </span>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 sm:pt-6 pointer-events-none">
        <div
          className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            isScrolled
              ? "w-[95%] max-w-6xl bg-navy-900/70 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2.5 px-6"
              : "w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 bg-transparent"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-bold font-serif text-white tracking-tight group-hover:text-gold transition-colors duration-300">
                {SITE_NAME}
                <span className="text-gold">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <NavLink to="/">{t("header.home")}</NavLink>
              <NavLink to="/plan" badge={<AIBadge />}>
                {t("header.tripPlanner")}
              </NavLink>
              <NavLink to="/about">{t("header.about")}</NavLink>
              <NavLink to="/contact">{t("header.contact")}</NavLink>

              {/* Search Bar Container */}
              <div
                className={`ml-4 transition-all duration-500 ${isScrolled ? "scale-90" : "scale-100"}`}
              >
                <SearchBar />
              </div>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher - Minimalist */}
              <div className="mr-2">
                <LanguageSwitcher />
              </div>

              <a
                href={TRIPZY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
              >
                <MapPin size={16} className="text-gold" />
                <span className="hidden xl:inline">
                  {t("header.tripzyDeals")}
                </span>
                <span className="xl:hidden">Deals</span>
              </a>

              {isAuthenticated ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy-950 px-5 py-2 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:-translate-y-0.5"
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden xl:inline">Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-navy-800/50 hover:bg-navy-700 text-white px-5 py-2 rounded-full font-medium transition-all border border-white/10 hover:border-gold/30"
                >
                  <LogIn size={16} />
                  {t("header.login")}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white hover:text-gold transition-colors relative group"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform" />
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Full Screen Glass */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-navy-950/80 backdrop-blur-xl"
          onClick={closeMenu}
        />

        {/* Mobile Menu Content */}
        <div
          className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-navy-900/50 shadow-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ boxShadow: "-10px 0 40px rgba(0,0,0,0.5)" }}
        >
          <div className="flex flex-col h-full relative overflow-hidden">
            {/* Decorative Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
              <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-gold rounded-full blur-[120px]" />
              <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
            </div>

            {/* Mobile Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
              <span className="text-2xl font-bold font-serif text-white">
                {SITE_NAME}
                <span className="text-gold">.</span>
              </span>
              <button
                onClick={closeMenu}
                className="p-2 text-white hover:text-gold transition-colors bg-white/5 rounded-full"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col items-center justify-center flex-grow p-8 space-y-6 relative z-10">
              <MobileNavLink to="/">{t("header.home")}</MobileNavLink>
              <MobileNavLink to="/plan" badge={<AIBadge />}>
                {t("header.tripPlanner")}
              </MobileNavLink>
              <MobileNavLink to="/about">{t("header.about")}</MobileNavLink>
              <MobileNavLink to="/contact">{t("header.contact")}</MobileNavLink>

              <div className="w-full max-w-xs py-6" onClick={closeMenu}>
                <SearchBar />
              </div>

              <div className="w-full space-y-4 pt-6 mt-6 border-t border-white/5">
                <a
                  href={TRIPZY_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white px-4 py-4 rounded-2xl font-semibold transition-all border border-white/10"
                >
                  <MapPin size={20} className="text-gold" />
                  Explore Tripzy Deals
                  <ExternalLink size={16} />
                </a>

                {isAuthenticated ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 w-full bg-gold hover:bg-gold-light text-navy-950 px-4 py-4 rounded-2xl font-bold"
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 w-full bg-navy-800 text-white px-4 py-4 rounded-2xl font-medium border border-white/10"
                  >
                    <LogIn size={20} />
                    Admin Login
                  </Link>
                )}

                <div className="w-full pt-4 flex justify-center">
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header - adjusted for float */}
      <div className="h-28" />
    </>
  );
};

export default Header;
