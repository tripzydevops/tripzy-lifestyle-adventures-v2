import React, { useState, useEffect } from "react";
import { newsletterService } from "../../services/newsletterService";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import { Mail, Download, Copy, Users, Check } from "lucide-react";

const ManageSubscribersPage = () => {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const data = await newsletterService.getAllSubscribers();
        setSubscribers(data);
      } catch (error) {
        addToast("Failed to load subscribers", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, [addToast]);

  const handleCopyEmails = () => {
    const allEmails = subscribers.join(", ");
    navigator.clipboard.writeText(allEmails);
    setCopied(true);
    addToast("Emails copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," + subscribers.map((e) => e).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscribers_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter((email) =>
    email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
            <Mail size={32} className="text-gold" />
            {t("admin.newsletter") || "Newsletter Subscribers"}
          </h1>
          <p className="text-gray-400 text-sm">
            {t("admin.newsletterSubtitle") ||
              "Manage and export your loyal audience."}{" "}
            Total: {subscribers.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyEmails}
            className="px-4 py-2 bg-navy-800 border border-white/5 hover:bg-white/5 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
          >
            {copied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? "Copied" : "Copy All"}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gold text-navy-950 rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all font-bold flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search emails..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-navy-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/30 transition-all"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : filteredSubscribers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscribers.map((email) => (
              <div
                key={email}
                className="p-4 bg-navy-800/50 border border-white/5 rounded-xl flex items-center gap-3 hover:border-gold/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {email}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Subscriber
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            <Mail size={48} className="mx-auto mb-4 opacity-20" />
            <p>No subscribers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubscribersPage;
