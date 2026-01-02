import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
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
  GripVertical,
} from "lucide-react";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMediaButtonClick: () => void;
}

// A unique ID for image placeholders
const PLACEHOLDER_CLASS = "tripzy-image-placeholder";

const WYSIWYGEditor_V6 = forwardRef<
  { insertHtml: (html: string) => void },
  WYSIWYGEditorProps
>(({ value, onChange, onMediaButtonClick }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);
  const { addToast } = useToast();
  const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(
    null
  );

  // --- History ---
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  const saveToHistory = (content: string) => {
    if (
      historyIndex.current >= 0 &&
      history.current[historyIndex.current] === content
    )
      return;
    const newHistory = history.current.slice(0, historyIndex.current + 1);
    newHistory.push(content);
    if (newHistory.length > 50) newHistory.shift();
    history.current = newHistory;
    historyIndex.current = newHistory.length - 1;
  };

  const undo = () => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const content = history.current[historyIndex.current];
      isInternalUpdate.current = true;
      if (editorRef.current) editorRef.current.innerHTML = content;
      onChange(content);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }
  };

  const redo = () => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      const content = history.current[historyIndex.current];
      isInternalUpdate.current = true;
      if (editorRef.current) editorRef.current.innerHTML = content;
      onChange(content);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }
  };

  // --- Placeholder System ---
  const addImagePlaceholder = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const id = `placeholder-${Date.now()}`;
    const placeholderHtml = `
      <div id="${id}" class="${PLACEHOLDER_CLASS}" contenteditable="false" draggable="true" style="margin: 2rem 0; padding: 3rem; border: 3px dashed #EAB308; border-radius: 2rem; background: rgba(234, 179, 8, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; cursor: pointer; transition: all 0.3s;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #EAB308; font-weight: bold; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          Click to Upload Image
        </div>
        <p style="color: #64748b; font-size: 0.7rem; margin: 0;">Or drag this block to reposition it</p>
      </div>
    `;

    // Insert at the end of the editor
    editor.insertAdjacentHTML("beforeend", placeholderHtml);

    const newContent = editor.innerHTML;
    onChange(newContent);
    saveToHistory(newContent);
  };

  // Handle click on placeholder to trigger upload
  const handlePlaceholderClick = (placeholderId: string) => {
    setActivePlaceholderId(placeholderId);
    fileInputRef.current?.click();
  };

  // Handle file selection - replaces the active placeholder
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePlaceholderId) return;

    const editor = editorRef.current;
    const placeholder = editor?.querySelector(`#${activePlaceholderId}`);
    if (!placeholder) {
      addToast("Placeholder not found. Try again.", "error");
      return;
    }

    // Show uploading state
    placeholder.innerHTML = `<div style="color: #EAB308; font-weight: bold;">Uploading...</div>`;

    try {
      const url = await uploadService.uploadFile(file);
      const imageHtml = `
        <figure style="margin: 3rem 0; width: 100%;">
          <img src="${url}" alt="Travel Photo" style="width: 100%; height: auto; border-radius: 2rem; display: block; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);"/>
        </figure>
      `;

      // Replace placeholder with the actual image
      const div = document.createElement("div");
      div.innerHTML = imageHtml;
      placeholder.parentNode?.replaceChild(div.firstElementChild!, placeholder);

      const newContent = editor?.innerHTML || "";
      onChange(newContent);
      saveToHistory(newContent);
      addToast("Image uploaded successfully!", "success");
    } catch (err) {
      addToast("Upload failed. Please try again.", "error");
      placeholder.innerHTML = `<div style="color: #ef4444;">Upload Failed. Click to retry.</div>`;
    } finally {
      setActivePlaceholderId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Insert HTML from Media Library
  const insertHtmlFromLibrary = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Just append at the end - reliable and predictable
    editor.insertAdjacentHTML("beforeend", html);
    const newContent = editor.innerHTML;
    onChange(newContent);
    saveToHistory(newContent);
  };

  useImperativeHandle(ref, () => ({
    insertHtml: insertHtmlFromLibrary,
  }));

  // Event delegation for placeholder clicks
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const placeholder = target.closest(
        `.${PLACEHOLDER_CLASS}`
      ) as HTMLElement;
      if (placeholder && placeholder.id) {
        e.preventDefault();
        e.stopPropagation();
        handlePlaceholderClick(placeholder.id);
      }
    };

    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  // Sync value from props
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      editor.innerHTML = value || "<p><br></p>";
      if (history.current.length === 0) saveToHistory(value);
    }
  }, [value]);

  const lastClickedImg = useRef<HTMLImageElement | null>(null);

  // Image selection handler
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleImgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        lastClickedImg.current = target as HTMLImageElement;
        editor
          .querySelectorAll("img")
          .forEach((img) => ((img as HTMLElement).style.outline = "none"));
        target.style.outline = "4px solid #EAB308";
        target.style.outlineOffset = "4px";
      } else if (!target.closest(`.${PLACEHOLDER_CLASS}`)) {
        editor
          .querySelectorAll("img")
          .forEach((img) => ((img as HTMLElement).style.outline = "none"));
        lastClickedImg.current = null;
      }
    };
    editor.addEventListener("click", handleImgClick);
    return () => editor.removeEventListener("click", handleImgClick);
  }, []);

  const deleteSelected = () => {
    if (lastClickedImg.current) {
      // Remove the figure wrapper if exists, otherwise just the image
      const figure = lastClickedImg.current.closest("figure");
      if (figure) figure.remove();
      else lastClickedImg.current.remove();
      lastClickedImg.current = null;
      onChange(editorRef.current?.innerHTML || "");
    } else {
      document.execCommand("delete", false);
    }
  };

  const toolbarButtons = [
    { icon: Undo2, action: undo, title: "Undo" },
    { icon: Redo2, action: redo, title: "Redo" },
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
        document.execCommand("createLink", false, prompt("Enter URL:") || ""),
      title: "Link",
    },
    {
      icon: ImagePlus,
      action: addImagePlaceholder,
      title: "Add Image Block",
      highlight: true,
    },
    { type: "divider" },
    {
      label: "25%",
      action: () => {
        if (lastClickedImg.current) {
          lastClickedImg.current.style.width = "25%";
          onChange(editorRef.current!.innerHTML);
        }
      },
    },
    {
      label: "50%",
      action: () => {
        if (lastClickedImg.current) {
          lastClickedImg.current.style.width = "50%";
          onChange(editorRef.current!.innerHTML);
        }
      },
    },
    {
      label: "100%",
      action: () => {
        if (lastClickedImg.current) {
          lastClickedImg.current.style.width = "100%";
          onChange(editorRef.current!.innerHTML);
        }
      },
    },
    { type: "divider" },
    { icon: Trash2, action: deleteSelected, title: "Delete", danger: true },
  ];

  return (
    <div className="bg-white rounded-[48px] border-8 border-slate-50 shadow-2xl min-h-[800px] relative">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="sticky top-4 z-50 mx-6 mt-6 p-3 bg-white/95 backdrop-blur-xl rounded-[28px] border border-slate-100 shadow-xl flex flex-wrap items-center gap-1.5">
        {toolbarButtons.map((btn, i) => {
          if (btn.type === "divider")
            return <div key={i} className="w-px h-6 bg-slate-200 mx-1.5" />;
          if (btn.label)
            return (
              <button
                key={i}
                type="button"
                onClick={btn.action}
                className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 rounded-lg hover:bg-gold hover:text-navy-950 transition-all"
              >
                {btn.label}
              </button>
            );
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
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                btn.highlight
                  ? "bg-gold text-navy-950 shadow-md hover:shadow-lg"
                  : btn.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-500 hover:bg-slate-100 hover:text-navy-950"
              }`}
            >
              <Icon size={18} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => {
          const content = e.currentTarget.innerHTML;
          onChange(content);
          saveToHistory(content);
        }}
        className="min-h-[700px] p-16 md:p-24 focus:outline-none prose prose-xl max-w-none font-serif text-slate-800 prose-headings:font-black prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor_V6;
