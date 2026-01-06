import React, { useEffect, useState } from "react";
import { unsplashService } from "../../services/unsplashService"; // Adjust path if needed
import { Image } from "lucide-react";

interface DynamicUnsplashImageProps {
  query: string;
  alt: string;
  postContext?: string; // e.g., "Paris" to make searches more relevant
  className?: string;
}

const DynamicUnsplashImage: React.FC<DynamicUnsplashImageProps> = ({
  query,
  alt,
  postContext,
  className,
}) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      try {
        const cleanQuery = query.replace("unsplash:", "").trim();
        // Heuristic: First word of title is usually the location (e.g. "Paris", "Bali")
        const locationContext = postContext ? postContext.split(" ")[0] : "";
        const searchQuery = `${cleanQuery} ${locationContext} travel aesthetic`;
        const { results } = await unsplashService.searchPhotos(
          searchQuery,
          1,
          1
        );

        if (isMounted && results.length > 0) {
          setImgUrl(results[0].url);
        }
      } catch (err) {
        console.warn("Dynamic image fetch failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();
    return () => {
      isMounted = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div
        className={`w-full h-64 bg-navy-800 animate-pulse rounded-2xl flex items-center justify-center ${className}`}
      >
        <Image className="w-8 h-8 text-navy-600" />
      </div>
    );
  }

  if (!imgUrl) {
    // Fallback if no image found - render nothing or a placeholder?
    // Let's render nothing to avoid ugly broken UI
    return null;
  }

  return (
    <div className="my-10 relative group">
      <img
        src={imgUrl}
        alt={alt}
        className={`rounded-2xl shadow-2xl mx-auto block max-h-[600px] object-cover w-full scale-100 hover:scale-[1.02] transition-transform duration-500 ${className}`}
      />
      <p className="text-center text-xs text-gray-500 mt-3 italic">
        {alt} (via Unsplash)
      </p>
    </div>
  );
};

export default DynamicUnsplashImage;
