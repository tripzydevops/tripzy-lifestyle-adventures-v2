import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ImageGallery from "./ImageGallery";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

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

    // 1. STRIP INTERNAL SECTIONS (Agent Approach, Intelligence Data)
    let processedContent = content
      .replace(/## 🛠 TRIPZY INTELLIGENCE DATA[\s\S]*?(?=##|$)/gi, "")
      .replace(/## The Multi-Agent Perspective[\s\S]*?(?=##|$)/gi, "")
      .replace(/\[IMAGE:\s*[^\]]*\]/g, "")
      .replace(
        /<div class="magazine-image-placeholder"[^>]*>[\s\S]*?<\/div>/g,
        ""
      )
      .replace(/<div data-placeholder-id="[^"]*"[^>]*>[\s\S]*?<\/div>/g, "")
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, "");

    // 2. ROBUST FORMAT DETECTION
    const hasHtmlTags = /<p>|<div|<article|<span|<br/i.test(processedContent);
    const isLegacyHtml =
      hasHtmlTags &&
      (processedContent.includes("<article") ||
        (processedContent.match(/<p>/g) || []).length > 2);

    if (isLegacyHtml) {
      return (
        <div
          className="legacy-html-content prose prose-invert lg:prose-xl max-w-none text-gray-300"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
    }

    // 3. MARKDOWN RENDERING (for AI guides and clean Markdown)
    return (
      <div className="markdown-content prose prose-invert lg:prose-xl max-w-none text-gray-300">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h2: ({ node, children, ...props }) => {
              const text = React.Children.toArray(children).join("");
              const id = slugify(text);
              return (
                <h2
                  id={id}
                  className="text-gold font-serif mt-12 mb-6"
                  {...props}
                >
                  {children}
                </h2>
              );
            },
            h3: ({ node, children, ...props }) => {
              const text = React.Children.toArray(children).join("");
              const id = slugify(text);
              return (
                <h3
                  id={id}
                  className="text-white font-serif mt-8 mb-4 border-b border-white/10 pb-2"
                  {...props}
                >
                  {children}
                </h3>
              );
            },
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-8 rounded-xl border border-white/10 bg-navy-950/50 p-1">
                <table
                  className="min-w-full divide-y divide-white/10 text-sm"
                  {...props}
                />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-navy-800" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th
                className="px-4 py-3 text-left font-bold text-gold uppercase tracking-wider"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="px-4 py-3 text-gray-300 whitespace-pre-wrap border-t border-white/5"
                {...props}
              />
            ),
            img: ({ node, src, alt, ...props }) => {
              return (
                <div className="my-10 relative group">
                  <img
                    src={src}
                    alt={alt || "Tripzy Travel Story"}
                    className="rounded-2xl shadow-2xl mx-auto block max-h-[600px] object-cover w-full scale-100 hover:scale-[1.02] transition-transform duration-500"
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).parentElement!.style.display = "none";
                    }}
                    {...props}
                  />
                  {alt && (
                    <p className="text-center text-xs text-gray-500 mt-3 italic">
                      {alt}
                    </p>
                  )}
                </div>
              );
            },
            p: ({ node, ...props }) => (
              <p className="mb-6 leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc list-inside space-y-2 mb-6 text-gray-400"
                {...props}
              />
            ),
            li: ({ node, ...props }) => (
              <li className="marker:text-gold" {...props} />
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }, [content]);

  return <>{renderedContent}</>;
};

export default PostContentRenderer;
