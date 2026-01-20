import React from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { useLanguage } from "../localization/LanguageContext";

const TermsOfServicePage = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO
        title="Terms of Service"
        description="Terms of Service for Tripzy Lifestyle Adventures."
      />
      <Header />

      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-navy-800 rounded-3xl p-8 md:p-12 border border-white/5 shadow-xl">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-white mb-8">
            Terms of Service
          </h1>
          <p className="text-slate-400 mb-8">Last Updated: January 20, 2026</p>

          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-6 text-slate-300">
              By accessing and using Tripzy Lifestyle Adventures
              (tripzy.travel), you accept and agree to be bound by the terms and
              provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              2. Use of Content
            </h2>
            <p className="mb-6 text-slate-300">
              All content provided on this site is for informational purposes
              only. The owner of this blog makes no representations as to the
              accuracy or completeness of any information on this site or found
              by following any link on this site.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              3. Intellectual Property
            </h2>
            <p className="mb-6 text-slate-300">
              The site and its original content, features, and functionality are
              owned by Tripzy Lifestyle Adventures and are protected by
              international copyright, trademark, patent, trade secret, and
              other intellectual property or proprietary rights laws.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              4. User Contributions
            </h2>
            <p className="mb-6 text-slate-300">
              Users may post comments or other content as long as it is not
              obscene, illegal, defamatory, threatening, infringing of
              intellectual property rights, invasive of privacy, or injurious in
              any other way to third parties.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">5. Disclaimer</h2>
            <p className="mb-6 text-slate-300">
              Your use of the service is at your sole risk. The service is
              provided on an "AS IS" and "AS AVAILABLE" basis.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              6. Changes to Terms
            </h2>
            <p className="mb-6 text-slate-300">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. What constitutes a material change will
              be determined at our sole discretion.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">7. Contact Us</h2>
            <p className="mb-6 text-slate-300">
              If you have any questions about these Terms, please contact us at:{" "}
              <a
                href="mailto:legal@tripzy.travel"
                className="text-gold hover:underline"
              >
                legal@tripzy.travel
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
