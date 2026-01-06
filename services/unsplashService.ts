import { createApi } from "unsplash-js";

// We fallback to a 'demo' mode if no key is present, where we might just return empty or mock data.
// But ideally, the user should provide a key.

let unsplash: ReturnType<typeof createApi> | null = null;

const getUnsplashKey = () => {
  return (
    import.meta.env.VITE_UNSPLASH_ACCESS_KEY ||
    (process.env as any).VITE_UNSPLASH_ACCESS_KEY
  );
};

// Access key at module level for absolute certainty
const UNSPLASH_KEY = getUnsplashKey();
console.log(
  "Unsplash Module Load - Key status:",
  UNSPLASH_KEY ? `PRESENT (length: ${UNSPLASH_KEY.length})` : "MISSING"
);

export const initUnsplash = () => {
  const key = UNSPLASH_KEY;
  if (key && !unsplash) {
    console.log("Initializing Unsplash instance...");
    try {
      unsplash = createApi({
        accessKey: key,
      });
      console.log("Unsplash instance created successfully.");
    } catch (e) {
      console.error("Failed to create Unsplash API instance:", e);
    }
  }
};

export const unsplashService = {
  async searchPhotos(query: string, page: number = 1, perPage: number = 20) {
    if (!unsplash) {
      initUnsplash();
      if (!unsplash) {
        // Fallback or Error if still no key
        console.warn("Unsplash API Key missing (VITE_UNSPLASH_ACCESS_KEY)");
        return { results: [], total: 0 };
      }
    }

    try {
      const result = await unsplash.search.getPhotos({
        query,
        page,
        perPage,
        orientation: "landscape",
      });

      if (result.errors) {
        console.error("Unsplash Error:", result.errors);
        return { results: [], total: 0 };
      }

      return {
        results: result.response.results.map((photo) => ({
          id: photo.id,
          url: photo.urls.regular,
          thumbnail: photo.urls.small,
          description:
            photo.alt_description || photo.description || "Unsplash Image",
          downloadLocation: photo.links.download_location, // Needed for attribution tracking if compliant
          photographer: {
            name: photo.user.name,
            username: photo.user.username,
            link: photo.user.links.html,
          },
        })),
        total: result.response.total,
      };
    } catch (error) {
      console.error("Unsplash Service Error:", error);
      return { results: [], total: 0 };
    }
  },

  isConfigured: () => {
    return !!getUnsplashKey();
  },
};
