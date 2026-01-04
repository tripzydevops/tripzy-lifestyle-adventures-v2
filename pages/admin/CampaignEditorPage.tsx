import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../localization/LanguageContext";
import { useToast } from "../../hooks/useToast";
import { newsletterService } from "../../services/newsletterService";
import Spinner from "../../components/common/Spinner";
import { Save, Send, ArrowLeft, Mail, LayoutTemplate } from "lucide-react";

const CampaignEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaign(id);
    }
  }, [id]);

  const loadCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      // In a real app we'd have a getCampaignById method,
      // but for now we filter from all campaigns (not efficient but works for MVP)
      const campaigns = await newsletterService.getCampaigns();
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        setSubject(campaign.subject);
        setContent(campaign.contentHtml);
      } else {
        addToast("Campaign not found", "error");
        navigate("/admin/newsletter-campaigns");
      }
    } catch (error) {
      addToast("Error loading campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      addToast("Subject line is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await newsletterService.updateCampaign(id, {
          subject,
          contentHtml: content,
        });
        addToast("Campaign saved", "success");
      } else {
        await newsletterService.createCampaign(subject, content);
        addToast("Campaign created", "success");
        navigate("/admin/newsletter-campaigns");
      }
    } catch (error) {
      addToast("Failed to save campaign", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = () => {
    // Placeholder for sending a test email to self
    addToast("Test email sent to your admin address", "info");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/admin/newsletter-campaigns")}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              {id ? "Edit Campaign" : "New Campaign"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-navy-800 border border-white/10 text-white rounded-xl font-bold hover:bg-navy-700 transition-colors flex items-center gap-2 text-sm"
          >
            <LayoutTemplate size={16} />
            {previewMode ? "Edit Mode" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-navy-800 border border-white/10 text-white rounded-xl font-bold hover:bg-navy-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleSendTest}
            className="px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-xl font-bold hover:bg-gold/20 transition-colors flex items-center gap-2 text-sm"
          >
            <Mail size={16} />
            Send Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        {/* Editor Column */}
        <div
          className={`lg:col-span-2 flex flex-col gap-6 ${
            previewMode ? "hidden lg:flex" : ""
          }`}
        >
          {/* Subject Line */}
          <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. 5 Hidden Gems in Bali 🌴"
              className="w-full bg-navy-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-all font-serif text-lg"
            />
          </div>

          {/* HTML Editor */}
          <div className="flex-1 bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
              Email Content (HTML)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h1>Hello Traveler!</h1><p>Write your newsletter here...</p>"
              className="flex-1 w-full bg-navy-950/50 border border-white/10 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-gold/50 transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Use basic HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;a&gt;,
              &lt;img&gt;.
            </p>
          </div>
        </div>

        {/* Preview Column */}
        <div
          className={`lg:col-span-1 bg-white rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl ${
            !previewMode ? "hidden lg:flex" : "flex h-full"
          }`}
        >
          <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Live Preview
            </span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-0">
            <div className="max-w-full h-full">
              {/* Email Header Simulation */}
              <div className="bg-navy-950 px-6 py-8 text-center text-white">
                <h2 className="text-xl font-serif font-bold tracking-tight">
                  Tripzy <span className="text-gold">Adventures</span>
                </h2>
              </div>

              {/* Email Body Content */}
              <div className="p-8 prose prose-slate max-w-none text-gray-800">
                {content ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <p className="text-gray-400 italic text-center py-10">
                    Start typing to see your email preview...
                  </p>
                )}
              </div>

              {/* Email Footer Simulation */}
              <div className="bg-gray-100 px-6 py-8 text-center text-xs text-gray-500">
                <p>© 2024 Tripzy Lifestyle Adventures. All rights reserved.</p>
                <p className="mt-2">
                  You are receiving this email because you subscribed to our
                  newsletter.
                </p>
                <p className="mt-2 underline cursor-pointer">Unsubscribe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignEditorPage;
