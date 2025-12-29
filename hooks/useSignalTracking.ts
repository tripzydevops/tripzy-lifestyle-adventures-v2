// hooks/useSignalTracking.ts
import { useEffect, useRef, useCallback } from "react";
import { trackSignal, trackPostEngagement } from "../services/signalService";

/**
 * Hook to track user signals on a specific page/component
 * Especially useful for Layer 1 Signal Collection
 */
export const useSignalTracking = (
  targetId?: string,
  type: "post" | "category" | "generic" = "generic"
) => {
  const startTime = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);
  const scrollTracker = useRef<NodeJS.Timeout | null>(null);

  // 1. Log view signal immediately
  useEffect(() => {
    if (targetId) {
      trackSignal({
        signalType: "view",
        targetId,
        metadata: { contentType: type },
      });
    }

    // Capture exit engagement
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      if (targetId && timeSpent > 2) {
        // Only track if they stayed > 2 seconds
        trackPostEngagement(targetId, {
          scrollDepth: maxScroll.current,
          timeSpentSeconds: timeSpent,
        });
      }
    };
  }, [targetId, type]);

  // 2. Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTracker.current) return;

      scrollTracker.current = setTimeout(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(
          100,
          Math.round((scrollTop / docHeight) * 100)
        );

        if (scrollPercent > maxScroll.current) {
          maxScroll.current = scrollPercent;
        }
        scrollTracker.current = null;
      }, 500); // Throttle scroll tracking
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Hover tracking helper
  const trackHover = useCallback(
    (elementId: string) => {
      trackSignal({
        signalType: "hover",
        targetId: targetId,
        metadata: { elementId, timestamp: new Date().toISOString() },
      });
    },
    [targetId]
  );

  return { trackHover };
};
