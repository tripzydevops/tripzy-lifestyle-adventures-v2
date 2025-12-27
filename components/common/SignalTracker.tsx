import React from "react";
import { useSignalTracker } from "../../hooks/useSignalTracker";

/**
 * Component that initializes the Signal Tracker.
 * It doesn't render anything, but its hook handles the page view tracking.
 */
const SignalTracker: React.FC = () => {
  useSignalTracker();
  return null;
};

export default SignalTracker;
