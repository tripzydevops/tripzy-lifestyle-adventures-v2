import React, { useMemo } from "react";
import { useLanguage } from "../../localization/LanguageContext";
import { Activity, BarChart2, TrendingUp } from "lucide-react";

interface SignalData {
  date: string;
  views: number;
  clicks: number;
  searches: number;
}

interface PostStatsChartProps {
  data: SignalData[];
  isLoading?: boolean;
}

const PostStatsChart: React.FC<PostStatsChartProps> = ({ data, isLoading }) => {
  const { t } = useLanguage();

  const maxViews = useMemo(() => {
    return Math.max(...data.map((d) => d.views), 10);
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-navy-900/50 rounded-3xl border border-white/5 animate-pulse">
        <div className="text-gray-500 flex flex-col items-center gap-2">
          <Activity size={24} className="animate-bounce" />
          <span className="text-xs uppercase tracking-widest font-bold">
            Loading Intelligence...
          </span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-navy-900/50 rounded-3xl border border-white/5">
        <div className="text-gray-500 flex flex-col items-center gap-2">
          <BarChart2 size={24} />
          <span className="text-xs uppercase tracking-widest font-bold">
            No Signal Data Yet
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <TrendingUp size={20} className="text-gold" />
          {t("admin.dashboard.performance") || "Signal Intelligence"}
        </h2>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Views
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gold"></span> Interactions
          </div>
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-2">
        {data.map((item, index) => {
          const heightPercent = (item.views / maxViews) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-950 border border-white/10 px-3 py-2 rounded-xl shadow-xl z-10 pointer-events-none w-32 text-center">
                <div className="text-xs font-bold text-white mb-1">
                  {item.date}
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Views:</span>{" "}
                  <span className="text-blue-400 text-right">{item.views}</span>
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Clicks:</span>{" "}
                  <span className="text-gold text-right">{item.clicks}</span>
                </div>
              </div>

              <div className="w-full h-full flex items-end gap-1 px-1 rounded-xl hover:bg-white/5 transition-colors">
                {/* Views Bar */}
                <div
                  className="w-1/2 bg-blue-500/80 hover:bg-blue-400 transition-all rounded-t-lg relative"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                ></div>
                {/* Interactions (Clicks + Searches) Bar - Scaled up for visibility */}
                <div
                  className="w-1/2 bg-gold/80 hover:bg-gold transition-all rounded-t-lg relative"
                  style={{
                    height: `${Math.max(
                      ((item.clicks + item.searches) / maxViews) * 100 * 2,
                      5
                    )}%`,
                  }}
                ></div>
              </div>

              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider -rotate-45 origin-left translate-y-4 translate-x-1 whitespace-nowrap">
                {item.date.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostStatsChart;
