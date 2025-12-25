import React, { useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { SITE_NAME } from '../../constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogVideo?: string;
  type?: 'website' | 'article';
}

// Helper to set or create a meta tag
const setMetaTag = (attr: 'name' | 'property', value: string, content: string) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement;
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, value);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
};

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  ogVideo,
  type = 'website' 
}) => {
  const { settings } = useSettings();
  const siteName = settings?.siteName || SITE_NAME;
  const siteTagline = settings?.tagline || 'Your guide to adventure.';
  const baseUrl = window.location.origin + window.location.pathname;

  useEffect(() => {
    const pageTitle = title ? `${title} | ${siteName}` : `${siteName} - ${siteTagline}`;
    const pageDescription = description || siteTagline;
    
    // Standard tags
    document.title = pageTitle;
    setMetaTag('name', 'description', pageDescription);
    
    // Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    } else if (metaKeywords) {
      metaKeywords.remove();
    }
    
    // Open Graph Tags
    const finalOgImage = ogImage || settings?.seo?.ogImage;
    setMetaTag('property', 'og:title', title || settings?.seo?.ogTitle || siteName);
    setMetaTag('property', 'og:description', description || settings?.seo?.ogDescription || siteTagline);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', baseUrl);
    setMetaTag('property', 'og:site_name', siteName);
    
    if (finalOgImage) {
        setMetaTag('property', 'og:image', finalOgImage);
        setMetaTag('property', 'og:image:width', '1200');
        setMetaTag('property', 'og:image:height', '630');
    }

    if (ogVideo) {
        setMetaTag('property', 'og:video', ogVideo);
        setMetaTag('property', 'og:video:type', 'video/mp4');
    }
    
    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title || settings?.seo?.ogTitle || siteName);
    setMetaTag('name', 'twitter:description', description || settings?.seo?.ogDescription || siteTagline);
    if (finalOgImage) {
        setMetaTag('name', 'twitter:image', finalOgImage);
    }

  }, [title, description, keywords, ogImage, ogVideo, type, settings, siteName, siteTagline, baseUrl]);

  return null; // This component does not render anything
};

export default SEO;