import React from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { useLanguage } from "../localization/LanguageContext";

const PrivacyPolicyPage = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-navy-900">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Tripzy Lifestyle Adventures. Learn how we collect, use, and protect your data."
      />
      <Header />

      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-navy-800 rounded-3xl p-8 md:p-12 border border-white/5 shadow-xl">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-white mb-8">
            Privacy Policy
          </h1>
          <p className="text-slate-400 mb-8">Last Updated: January 20, 2026</p>

          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gold mb-4">
              1. Introduction
            </h2>
            <p className="mb-6 text-slate-300">
              Welcome to Tripzy Lifestyle Adventures ("we," "our," or "us"). We
              are committed to protecting your privacy and ensuring the security
              of your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              visit our website (tripzy.travel) and use our services.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              2. Information We Collect
            </h2>
            <p className="mb-4 text-slate-300">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 mb-6 text-slate-300 space-y-2">
              <li>
                <strong className="text-white">Personal Data:</strong> Name,
                email address, and other contact information you voluntarily
                provide when subscribing to our newsletter or contacting us.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Information
                about how you use our website, including your IP address,
                browser type, operating system, and pages visited.
              </li>
              <li>
                <strong className="text-white">Cookies:</strong> We use cookies
                to enhance your experience, analyze site usage, and assist in
                our marketing efforts.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="mb-4 text-slate-300">
              We use the collected information for various purposes, including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-slate-300 space-y-2">
              <li>To provide, maintain, and improve our services.</li>
              <li>
                To communicate with you, including sending newsletters and
                updates.
              </li>
              <li>To analyze usage trends and optimize our website.</li>
              <li>
                To detect, prevent, and address technical issues and fraud.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gold mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="mb-6 text-slate-300">
              We do not sell your personal data. We may share information with
              third-party service providers who assist us in operating our
              website (e.g., analytics providers, email marketing services),
              subject to confidentiality agreements. We may also disclose
              information if required by law.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">
              5. Your Rights (GDPR & CCPA)
            </h2>
            <p className="mb-4 text-slate-300">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 mb-6 text-slate-300 space-y-2">
              <li>
                <strong className="text-white">Access:</strong> Request a copy
                of the personal data we hold about you.
              </li>
              <li>
                <strong className="text-white">Correction:</strong> Request
                correction of inaccurate data.
              </li>
              <li>
                <strong className="text-white">Deletion:</strong> Request
                deletion of your personal data ("Right to be Forgotten").
              </li>
              <li>
                <strong className="text-white">Opt-Out:</strong> Opt-out of
                marketing communications.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gold mb-4">6. Security</h2>
            <p className="mb-6 text-slate-300">
              We implement appropriate technical and organizational measures to
              protect your data. However, no method of transmission over the
              internet is 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-gold mb-4">7. Contact Us</h2>
            <p className="mb-6 text-slate-300">
              If you have any questions about this Privacy Policy, please
              contact us at:{" "}
              <a
                href="mailto:privacy@tripzy.travel"
                className="text-gold hover:underline"
              >
                privacy@tripzy.travel
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

export default PrivacyPolicyPage;
