import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SITE_NAME } from "../constants";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { useLanguage } from "../localization/LanguageContext";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If authenticated, always go to dashboard
    if (isAuthenticated) {
      console.log("Authenticated, redirecting to dashboard...");
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError(t("login.errorEmpty"));
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/admin/dashboard");
    } else {
      setError(result.error || "Invalid email or password.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(t("login.errorFailedGoogle"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-950 px-4">
      <div className="w-full max-w-md p-8 bg-navy-900 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Language Switcher in Login */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSwitcher />
        </div>

        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gold font-serif mb-2">
              {t("login.title")}
            </h1>
            <p className="text-gray-400">{t("login.subtitle")}</p>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-navy-950 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              {t("login.googleButton")}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-white/10 flex-grow"></div>
              <span className="text-gray-500 text-sm font-medium">
                {t("login.or")}
              </span>
              <div className="h-px bg-white/10 flex-grow"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1"
              >
                {t("login.emailLabel")}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-navy-800 border border-white/5 text-white rounded-xl focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                  placeholder="admin@tripzy.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password-login"
                className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1"
              >
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  id="password-login"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-navy-800 border border-white/5 text-white rounded-xl focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-gold to-gold-dark text-navy-950 font-bold rounded-xl hover:shadow-xl hover:shadow-gold/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                t("common.loading")
              ) : (
                <>
                  <LogIn size={20} />
                  {t("login.submitButton")}
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <Link
              to="/"
              className="text-gray-500 hover:text-gold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              {t("login.backToWebsite")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
