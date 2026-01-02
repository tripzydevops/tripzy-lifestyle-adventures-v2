import React, { useMemo } from "react";
import ImageGallery from "./ImageGallery";

interface PostContentRendererProps {
  content: string;
}

const PostContentRenderer: React.FC<PostContentRendererProps> = ({
  content,
}) => {
  const galleryRegex = useMemo(
    () => /<div data-gallery="true">([\s\S]*?)<\/div>/g,
    []
  );
  const imgRegex = useMemo(() => /<img src="([^"]+)" alt="([^"]*)">]/g, []);

  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Sanitize content: Remove [IMAGE: ...] markers and placeholder elements
    let sanitizedContent = content
      // Remove [IMAGE: description] markers
      .replace(/\[IMAGE:\s*[^\]]*\]/g, "")
      // Remove magazine-image-placeholder divs
      .replace(
        /<div class="magazine-image-placeholder"[^>]*>[\s\S]*?<\/div>/g,
        ""
      )
      // Remove data-placeholder-id divs (editor placeholders)
      .replace(/<div data-placeholder-id="[^"]*"[^>]*>[\s\S]*?<\/div>/g, "")
      // Clean up multiple consecutive line breaks
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
      // Clean up empty paragraphs
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, "");

    const parts = sanitizedContent.split(galleryRegex);

    return parts.map((part, index) => {
      // Every odd index is the content of a gallery div
      if (index % 2 === 1) {
        const imageMatches = [...part.matchAll(imgRegex)];
        if (imageMatches.length === 0) {
          // Fallback for empty or invalid gallery div
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }

        const images = imageMatches.map((match) => ({
          src: match[1],
          alt: match[2] || "", // Ensure alt is always a string
        }));

        return <ImageGallery key={index} images={images} />;
      } else {
        // Even indexes are the regular HTML content
        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
    });
  }, [content, galleryRegex, imgRegex]);

  return <>{renderedContent}</>;
};

export default PostContentRenderer;
