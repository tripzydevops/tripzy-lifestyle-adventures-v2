const getApiUrl = () => {
  // In development, we need to point to the local backend.
  // For Android Emulator, use 10.0.2.2
  // For iOS Simulator, use localhost
  // For physical device, use your machine's LAN IP

  if (__DEV__) {
    // You might need to change this if testing on physical device
    // return "http://192.168.1.X:8000";

    // Defaulting to Android Emulator friendly address (works on iOS too usually? No, iOS needs localhost)
    // But we can detect platform?
    // For now, let's assume Android Emulator as primary test target or localhost via tunneling
    return "http://10.0.2.2:8000";
  }

  // Production URL
  return "https://api.tripzy.travel";
};

export const Config = {
  API_URL: getApiUrl(),
};
