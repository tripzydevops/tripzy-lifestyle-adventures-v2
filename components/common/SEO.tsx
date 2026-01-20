import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogVideo?: string;
  type?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: "website" | "article";
  };
  twitter?: {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    image?: string;
    creator?: string;
  };
}

/**
 * Reusable SEO component for managing document head tags.
 * Supports standard meta tags, OpenGraph, and Twitter cards.
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogVideo,
  type,
  openGraph,
  twitter,
}) => {
  const siteName = "Tripzy Lifestyle Adventures";
  const defaultDescription =
    "Your Gateway to Travel Inspiration. Discover personalized trip plans, hidden gems, and lifestyle adventures.";
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* OpenGraph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={openGraph?.title || title} />
      <meta
        property="og:description"
        content={openGraph?.description || description || defaultDescription}
      />
      <meta property="og:type" content={openGraph?.type || type || "website"} />
      {openGraph?.url && <meta property="og:url" content={openGraph.url} />}

      {(openGraph?.image || ogImage) && (
        <meta property="og:image" content={openGraph?.image || ogImage} />
      )}

      {ogVideo && <meta property="og:video" content={ogVideo} />}

      {/* Twitter */}
      <meta
        name="twitter:card"
        content={twitter?.card || "summary_large_image"}
      />
      <meta name="twitter:title" content={twitter?.title || title} />
      <meta
        name="twitter:description"
        content={twitter?.description || description || defaultDescription}
      />
      {(twitter?.image || openGraph?.image || ogImage) && (
        <meta
          name="twitter:image"
          content={twitter?.image || openGraph?.image || ogImage}
        />
      )}
      {twitter?.creator && (
        <meta name="twitter:creator" content={twitter.creator} />
      )}
    </Helmet>
  );
};

export default SEO;
