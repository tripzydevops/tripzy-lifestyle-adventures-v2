import React from "react";
import { Link } from "react-router-dom";
import { Map, Home, Search } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist."
      />
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <Map className="w-12 h-12 text-slate-500" />
            <div className="absolute -bottom-2 -right-2 bg-gold text-navy-950 font-bold px-3 py-1 rounded-full border-4 border-navy-900">
              404
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-6">
            Off the Map
          </h1>

          <p className="text-lg text-slate-300 mb-10">
            Looks like you've wandered into uncharted territory. The page you're
            looking for has moved or doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-gold text-navy-950 px-6 py-3 rounded-xl font-bold hover:bg-gold-light transition-colors"
            >
              <Home className="w-5 h-5" />
              Back Home
            </Link>

            <Link
              to="/search"
              className="flex items-center justify-center gap-2 bg-navy-800 text-white border border-white/10 px-6 py-3 rounded-xl font-bold hover:bg-navy-700 transition-colors"
            >
              <Search className="w-5 h-5" />
              Search Content
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
