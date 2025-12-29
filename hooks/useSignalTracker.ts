import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "../services/signalService";
import { useAuth } from "./useAuth";
import { useLanguage } from "../localization/LanguageContext";

export const useSignalTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();

  // Track Page Views
  useEffect(() => {
    track({
      event_type: "view",
      target_type: "page",
      target_id: location.pathname,
      user_id: user?.id,
      metadata: {
        path: location.pathname,
        search: location.search,
        referrer: document.referrer,
      },
    });
  }, [location.pathname, user?.id]);

  // Track Language Changes
  useEffect(() => {
    track({
      event_type: "language_change",
      target_type: "setting",
      target_id: language,
      user_id: user?.id,
      metadata: {
        language,
      },
    });
  }, [language, user?.id]);

  const trackClick = (
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>
  ) => {
    track({
      event_type: "click",
      target_type: targetType,
      target_id: targetId,
      user_id: user?.id,
      metadata,
    });
  };

  const trackSearch = (query: string, resultsCount: number) => {
    track({
      event_type: "search",
      target_type: "search_query",
      target_id: query,
      user_id: user?.id,
      metadata: {
        query,
        results_count: resultsCount,
      },
    });
  };

  return { trackClick, trackSearch };
};
