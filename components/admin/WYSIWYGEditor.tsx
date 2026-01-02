import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Trash2,
  ImagePlus,
  ChevronUp,
  ChevronDown,
  Upload,
  X,
  Maximize2,
} from "lucide-react";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMediaButtonClick: () => void;
}

// ============================================================
// IMAGE PLACEHOLDER BLOCK COMPONENT
// ============================================================
interface PlaceholderBlockProps {
  id: string;
  description?: string;
  onUpload: (id: string, file: File) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  isUploading?: boolean;
}

const ImagePlaceholderBlock: React.FC<PlaceholderBlockProps> = ({
  id,
  description,
  onUpload,
  onMoveUp,
  onMoveDown,
  onDelete,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(id, file);
    }
  };

  return (
    <div
      data-placeholder-id={id}
      className="image-placeholder-block my-6 p-6 border-2 border-dashed border-amber-400 rounded-2xl bg-amber-50/50 relative group"
      contentEditable={false}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Control Buttons - Top Right - Always visible */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={() => onMoveUp(id)}
          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-slate-100 text-slate-600"
          title="Move Up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(id)}
          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-slate-100 text-slate-600"
          title="Move Down"
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-100 text-red-500"
          title="Delete"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        {isUploading ? (
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Uploading...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <ImagePlus size={24} />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
            >
              <Upload size={18} />
              Click to Upload Image
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// IMAGE BLOCK COMPONENT (After Upload)
// ============================================================
interface ImageBlockProps {
  id: string;
  src: string;
  alt?: string;
  width: string;
  onResize: (id: string, width: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  id,
  src,
  alt,
  width,
  onResize,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  return (
    <div
      data-image-id={id}
      className="image-block my-6 relative group"
      contentEditable={false}
    >
      {/* Control Bar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={() => onMoveUp(id)}
          className="p-1.5 bg-white/90 rounded-lg shadow-md hover:bg-slate-100 text-slate-600"
          title="Move Up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(id)}
          className="p-1.5 bg-white/90 rounded-lg shadow-md hover:bg-slate-100 text-slate-600"
          title="Move Down"
        >
          <ChevronDown size={16} />
        </button>
        <div className="flex bg-white/90 rounded-lg shadow-md overflow-hidden">
          {["25%", "50%", "100%"].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onResize(id, w)}
              className={`px-2 py-1.5 text-xs font-bold transition-colors ${
                width === w
                  ? "bg-amber-500 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="p-1.5 bg-white/90 rounded-lg shadow-md hover:bg-red-100 text-red-500"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <img
        src={src}
        alt={alt || "Image"}
        style={{ width }}
        className="rounded-2xl shadow-xl mx-auto block"
      />
    </div>
  );
};

// ============================================================
// MAIN EDITOR COMPONENT
// ============================================================
interface Block {
  id: string;
  type: "text" | "placeholder" | "image";
  content: string;
  description?: string;
  src?: string;
  width?: string;
}

const WYSIWYGEditor_V7 = forwardRef<
  { insertHtml: (html: string) => void },
  WYSIWYGEditorProps
>(({ value, onChange, onMediaButtonClick }, ref) => {
  const { addToast } = useToast();

  // Parse content into blocks
  const parseContentToBlocks = useCallback((html: string): Block[] => {
    const blocks: Block[] = [];

    // Split by image placeholders and actual images
    const parts = html.split(
      /(\[IMAGE:\s*([^\]]+)\]|<div data-placeholder-id="[^"]+">.*?<\/div>|<div data-image-id="[^"]+">.*?<\/div>)/gs
    );

    parts.forEach((part, index) => {
      if (!part || !part.trim()) return;

      // Check for [IMAGE: description] pattern
      const imageMatch = part.match(/\[IMAGE:\s*([^\]]+)\]/);
      if (imageMatch) {
        blocks.push({
          id: `placeholder-${Date.now()}-${index}`,
          type: "placeholder",
          content: "",
          description: imageMatch[1].trim(),
        });
        return;
      }

      // Otherwise it's text content
      blocks.push({
        id: `text-${Date.now()}-${index}`,
        type: "text",
        content: part,
      });
    });

    return blocks.length > 0
      ? blocks
      : [{ id: "text-0", type: "text", content: "<p><br></p>" }];
  }, []);

  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseContentToBlocks(value)
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const textEditorRef = useRef<HTMLDivElement>(null);

  // Sync blocks to parent
  const syncToParent = useCallback(
    (newBlocks: Block[]) => {
      const html = newBlocks
        .map((block) => {
          if (block.type === "text") return block.content;
          if (block.type === "placeholder")
            return `[IMAGE: ${block.description || "Photo"}]`;
          if (block.type === "image")
            return `<div data-image-id="${block.id}"><img src="${
              block.src
            }" style="width: ${
              block.width || "100%"
            }; border-radius: 1rem; display: block; margin: 0 auto;" /></div>`;
          return "";
        })
        .join("\n");
      onChange(html);
    },
    [onChange]
  );

  // Update blocks when value changes externally
  useEffect(() => {
    const newBlocks = parseContentToBlocks(value);
    setBlocks(newBlocks);
  }, [value, parseContentToBlocks]);

  // --- Block Operations ---
  const addPlaceholder = () => {
    const newBlock: Block = {
      id: `placeholder-${Date.now()}`,
      type: "placeholder",
      content: "",
      description: "New Image",
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  const moveBlockUp = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index <= 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [
      newBlocks[index],
      newBlocks[index - 1],
    ];
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  const moveBlockDown = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index < 0 || index >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [
      newBlocks[index + 1],
      newBlocks[index],
    ];
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await uploadService.uploadFile(file);
      const newBlocks = blocks.map((b) =>
        b.id === id
          ? { ...b, type: "image" as const, src: url, width: "100%" }
          : b
      );
      setBlocks(newBlocks);
      syncToParent(newBlocks);
      addToast("Image uploaded!", "success");
    } catch (err) {
      addToast("Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  const handleResize = (id: string, width: string) => {
    const newBlocks = blocks.map((b) => (b.id === id ? { ...b, width } : b));
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  const handleTextChange = (blockId: string, newContent: string) => {
    const newBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, content: newContent } : b
    );
    setBlocks(newBlocks);
    syncToParent(newBlocks);
  };

  // Expose insertHtml for media library
  useImperativeHandle(ref, () => ({
    insertHtml: (html: string) => {
      // Extract image src from HTML
      const srcMatch = html.match(/src="([^"]+)"/);
      if (srcMatch) {
        const newBlock: Block = {
          id: `image-${Date.now()}`,
          type: "image",
          content: "",
          src: srcMatch[1],
          width: "100%",
        };
        const newBlocks = [...blocks, newBlock];
        setBlocks(newBlocks);
        syncToParent(newBlocks);
      }
    },
  }));

  const toolbarButtons = [
    { icon: Undo2, action: () => document.execCommand("undo"), title: "Undo" },
    { icon: Redo2, action: () => document.execCommand("redo"), title: "Redo" },
    { type: "divider" },
    { icon: Bold, action: () => document.execCommand("bold"), title: "Bold" },
    {
      icon: Italic,
      action: () => document.execCommand("italic"),
      title: "Italic",
    },
    {
      icon: Underline,
      action: () => document.execCommand("underline"),
      title: "Underline",
    },
    { type: "divider" },
    {
      icon: Heading2,
      action: () => document.execCommand("formatBlock", false, "h2"),
      title: "H2",
    },
    {
      icon: Heading3,
      action: () => document.execCommand("formatBlock", false, "h3"),
      title: "H3",
    },
    { type: "divider" },
    {
      icon: LinkIcon,
      action: () =>
        document.execCommand("createLink", false, prompt("URL:") || ""),
      title: "Link",
    },
    {
      icon: ImagePlus,
      action: addPlaceholder,
      title: "Add Image Block",
      highlight: true,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-xl min-h-[600px]">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 p-3 bg-white border-b border-slate-100 rounded-t-3xl flex flex-wrap items-center gap-1">
        {toolbarButtons.map((btn, i) => {
          if (btn.type === "divider")
            return <div key={i} className="w-px h-6 bg-slate-200 mx-1" />;
          const Icon = btn.icon!;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                btn.action();
              }}
              title={btn.title}
              className={`p-2 rounded-lg transition-all ${
                btn.highlight
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      {/* Block Editor */}
      <div className="p-8 md:p-12 space-y-4">
        {blocks.map((block) => {
          if (block.type === "placeholder") {
            return (
              <ImagePlaceholderBlock
                key={block.id}
                id={block.id}
                description={block.description}
                onUpload={handleUpload}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
                onDelete={deleteBlock}
                isUploading={uploadingId === block.id}
              />
            );
          }

          if (block.type === "image") {
            return (
              <ImageBlock
                key={block.id}
                id={block.id}
                src={block.src!}
                alt={block.description}
                width={block.width || "100%"}
                onResize={handleResize}
                onDelete={deleteBlock}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
              />
            );
          }

          // Text block - contenteditable div
          return (
            <div
              key={block.id}
              contentEditable
              suppressContentEditableWarning
              className="prose prose-lg max-w-none focus:outline-none min-h-[2rem]"
              dangerouslySetInnerHTML={{ __html: block.content }}
              onBlur={(e) =>
                handleTextChange(block.id, e.currentTarget.innerHTML)
              }
            />
          );
        })}
      </div>
    </div>
  );
});

export default WYSIWYGEditor_V7;
