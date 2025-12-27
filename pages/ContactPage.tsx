import React, { useState } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import SEO from "../components/common/SEO";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../localization/LanguageContext";
import { useSignalTracker } from "../hooks/useSignalTracker";

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { trackClick } = useSignalTracker();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errors[e.target.id]) {
      setErrors({ ...errors, [e.target.id]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Form submitted:", formData);
    trackClick("contact_form", "submit", {
      name: formData.name,
      email: formData.email,
    });
    addToast(t("contact.success"), "success");
    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-navy-950">
      <SEO title={t("header.contact")} description={t("contact.subtitle")} />
      <Header />
      <main className="flex-grow">
        {/* Header Section */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-4">
              {t("contact.title")}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </div>
        </section>

        <section className="pb-24 container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-navy-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-colors"></div>

              <h2 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
                <MessageSquare className="text-gold" />
                {t("contact.formTitle")}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("contact.nameLabel")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white focus:outline-none focus:ring-1 transition-all ${
                      errors.name
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-white/5 focus:border-gold/50 focus:ring-gold/20"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("contact.emailLabel")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white focus:outline-none focus:ring-1 transition-all ${
                      errors.email
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-white/5 focus:border-gold/50 focus:ring-gold/20"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="message"
                    className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("contact.messageLabel")}
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white focus:outline-none focus:ring-1 transition-all ${
                      errors.message
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-white/5 focus:border-gold/50 focus:ring-gold/20"
                    }`}
                  ></textarea>
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold text-navy-950 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    t("contact.submitting")
                  ) : (
                    <>
                      <Send size={18} />
                      {t("contact.submitButton")}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div className="flex flex-col justify-center space-y-12">
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 h-14 w-14 bg-navy-900 border border-white/5 text-gold rounded-2xl flex items-center justify-center group-hover:border-gold/30 transition-colors shadow-lg">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {t("contact.info.email")}
                  </h3>
                  <a
                    href="mailto:contact@tripzyadventures.com"
                    className="text-xl text-white font-serif hover:text-gold transition-colors"
                  >
                    hello@tripzy.travel
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 h-14 w-14 bg-navy-900 border border-white/5 text-gold rounded-2xl flex items-center justify-center group-hover:border-gold/30 transition-colors shadow-lg">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {t("contact.info.phone")}
                  </h3>
                  <p className="text-xl text-white font-serif">
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 h-14 w-14 bg-navy-900 border border-white/5 text-gold rounded-2xl flex items-center justify-center group-hover:border-gold/30 transition-colors shadow-lg">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {t("contact.info.address")}
                  </h3>
                  <p className="text-xl text-white font-serif leading-relaxed">
                    123 Adventure Lane, <br />
                    Wanderlust District, London
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <p className="text-gray-500 text-sm mb-4 italic">
                  Follow our journey:
                </p>
                <div className="flex gap-4">
                  {["Instagram", "Twitter", "Facebook"].map((social) => (
                    <a
                      key={social}
                      href="#"
                      onClick={() => trackClick("social_link", social)}
                      className="text-white/40 hover:text-gold transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
