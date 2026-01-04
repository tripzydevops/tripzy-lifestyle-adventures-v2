import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Edit3,
  Send,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../../localization/LanguageContext";
import { useToast } from "../../hooks/useToast";
import { newsletterService } from "../../services/newsletterService";
import { NewsletterCampaign } from "../../types";
import Spinner from "../../components/common/Spinner";
import { useNavigate } from "react-router-dom";

const NewsletterCampaignsPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock fetching campaigns for now until we hook up the page
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await newsletterService.getCampaigns();
      setCampaigns(data as NewsletterCampaign[]);
    } catch (error) {
      addToast("Failed to fetch campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSend = async (id: string, subject: string) => {
    if (
      !window.confirm(
        `Are you sure you want to send "${subject}" to all subscribers?`
      )
    )
      return;

    try {
      addToast("Sending campaign...", "info");
      await newsletterService.sendCampaign(id);
      addToast("Campaign sent successfully!", "success");
      fetchCampaigns();
    } catch (e) {
      addToast("Failed to send campaign", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "sending":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse";
      case "scheduled":
        return "text-gold bg-gold/10 border-gold/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Mail size={32} className="text-gold" />
            Newsletter Campaigns
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your email marketing campaigns and engage with your
            subscribers.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/newsletter/new")}
          className="px-6 py-3 bg-gold text-navy-950 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg shadow-gold/20"
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-navy-800 rounded-full flex items-center justify-center mb-6">
              <Mail size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-gray-400 max-w-md mb-8">
              Start engaging with your audience by creating your first
              newsletter campaign.
            </p>
            <button
              onClick={() => navigate("/admin/newsletter/new")}
              className="px-6 py-3 bg-navy-800 border border-white/10 text-white rounded-xl font-bold hover:bg-gold hover:text-navy-950 transition-colors"
            >
              Create New Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Campaign Subject
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Sent Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status === "sent" && (
                          <CheckCircle size={10} />
                        )}
                        {campaign.status === "draft" && <Edit3 size={10} />}
                        {campaign.status === "sending" && <Send size={10} />}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-white">
                        {campaign.subject}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-[300px]">
                        ID: {campaign.id}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">
                      {campaign.sentAt ? (
                        new Date(campaign.sentAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-gray-600 italic">
                          Not sent yet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      {campaign.status === "sent" ? (
                        <div className="text-sm">
                          <span className="text-white font-bold">
                            {campaign.recipientCount}
                          </span>
                          <span className="text-gray-500 ml-1">recipients</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === "draft" && (
                          <>
                            <button
                              onClick={() =>
                                handleSend(campaign.id, campaign.subject)
                              }
                              className="p-2 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded-lg transition-colors"
                              title="Send Now"
                            >
                              <Send size={18} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/newsletter/edit/${campaign.id}`
                                )
                              }
                              className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={18} />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterCampaignsPage;
