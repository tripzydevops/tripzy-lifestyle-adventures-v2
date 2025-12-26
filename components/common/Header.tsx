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
      setIsScrolled(window.scrollY > 20);
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
      className={`relative flex items-center gap-1.5 font-medium transition-colors duration-200 ${
        isActive(to) ? "text-gold" : "text-slate-300 hover:text-gold"
      }`}
    >
      {children}
      {badge}
      {isActive(to) && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold rounded-full" />
      )}
    </Link>
  );

  const MobileNavLink = ({ to, children, badge }: NavLinkProps) => (
    <Link
      to={to}
      onClick={closeMenu}
      className={`text-2xl font-medium py-3 text-center flex items-center justify-center gap-2 transition-colors duration-200 ${
        isActive(to) ? "text-gold" : "text-white hover:text-gold"
      }`}
    >
      {children}
      {badge}
    </Link>
  );

  const AIBadge = () => (
    <span className="bg-gold/20 text-gold text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 uppercase tracking-tighter">
      <Sparkles size={10} />
      AI
    </span>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-navy-900/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                {SITE_NAME}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/plan" badge={<AIBadge />}>
                Trip Planner
              </NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <div className="pl-4 border-l border-white/10">
                <SearchBar />
              </div>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={TRIPZY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-4 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all hover:-translate-y-0.5"
              >
                <MapPin size={16} />
                Tripzy Deals
                <ExternalLink size={14} />
              </a>

              {isAuthenticated ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all border border-white/10"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all border border-white/10"
                >
                  <LogIn size={16} />
                  Login
                </Link>
              )}

              <LanguageSwitcher />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white hover:text-gold transition-colors"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm"
          onClick={closeMenu}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-sm bg-navy-900 shadow-2xl transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-xl font-bold font-serif text-gold">
                {SITE_NAME}
              </span>
              <button
                onClick={closeMenu}
                className="p-2 text-white hover:text-gold transition-colors"
                aria-label="Close menu"
              >
                <X size={28} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col items-center justify-center flex-grow p-8 space-y-4">
              <MobileNavLink to="/">Home</MobileNavLink>
              <MobileNavLink to="/plan" badge={<AIBadge />}>
                Trip Planner
              </MobileNavLink>
              <MobileNavLink to="/about">About</MobileNavLink>
              <MobileNavLink to="/contact">Contact</MobileNavLink>

              <div className="w-full max-w-xs py-4" onClick={closeMenu}>
                <SearchBar />
              </div>

              <div className="w-full space-y-3 pt-4">
                <a
                  href={TRIPZY_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-gold to-gold-dark text-navy-950 px-4 py-3.5 rounded-xl font-semibold"
                >
                  <MapPin size={18} />
                  Explore Tripzy Deals
                  <ExternalLink size={14} />
                </a>

                {isAuthenticated ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 w-full bg-navy-700 text-white px-4 py-3.5 rounded-xl font-medium border border-white/10"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 w-full bg-navy-700 text-white px-4 py-3.5 rounded-xl font-medium border border-white/10"
                  >
                    <LogIn size={18} />
                    Admin Login
                  </Link>
                )}

                <div className="w-full pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  );
};

export default Header;
