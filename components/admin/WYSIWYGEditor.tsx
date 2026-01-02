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
  List,
  ListOrdered,
  Link as LinkIcon,
  Pilcrow,
  Heading2,
  Heading3,
  Film,
  Undo2,
  Redo2,
  Trash2,
  ImagePlus,
  Upload,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMediaButtonClick: () => void;
}

const WYSIWYGEditor_V5 = forwardRef<
  { insertHtml: (html: string) => void },
  WYSIWYGEditorProps
>(({ value, onChange, onMediaButtonClick }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelection = useRef<Range | null>(null);
  const isInternalUpdate = useRef<boolean>(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Floating UI state
  const [floatingMenuPos, setFloatingMenuPos] = useState<{
    top: number;
    visible: boolean;
  }>({ top: 0, visible: false });
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const activeLineRef = useRef<HTMLElement | null>(null);

  // --- Manual History ---
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);

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
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        editorRef.current.focus();
      }
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
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        editorRef.current.focus();
      }
      onChange(content);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }
  };

  // --- Reliable Insertion ---
  const insertHtmlAtNode = (html: string, targetNode: HTMLElement | null) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (targetNode && editor.contains(targetNode)) {
      // Replaces the placeholder line or active line
      const div = document.createElement("div");
      div.innerHTML = html;
      const fragment = document.createDocumentFragment();
      while (div.firstChild) fragment.appendChild(div.firstChild);

      targetNode.parentNode?.replaceChild(fragment, targetNode);
    } else {
      // Fallback: standard selection
      editor.focus();
      document.execCommand("insertHTML", false, html);
    }

    const freshContent = editor.innerHTML;
    onChange(freshContent);
    saveToHistory(freshContent);
    setShowPlusMenu(false);
    setFloatingMenuPos((prev) => ({ ...prev, visible: false }));
  };

  useImperativeHandle(ref, () => ({
    insertHtml: (html) => insertHtmlAtNode(html, activeLineRef.current),
  }));

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        lastSelection.current = range.cloneRange();

        // Find the block-level element the user is on
        let node = range.startContainer as Node;
        while (node && node.parentNode !== editorRef.current) {
          node = node.parentNode!;
        }
        if (node && node instanceof HTMLElement) {
          activeLineRef.current = node;
          const rect = node.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          setFloatingMenuPos({ top: rect.top - editorRect.top, visible: true });
        }
      }
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast("Writing photo to memory...", "info");
    try {
      const url = await uploadService.uploadFile(file);
      const html = `<div class="media-row" style="margin: 4rem 0; width: 100%;"><img src="${url}" style="width: 100%; border-radius: 4rem; display: block; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.25);" /><p style="margin-top: 2rem;"><br></p></div>`;
      insertHtmlAtNode(html, activeLineRef.current);
      addToast("Photo inserted!", "success");
    } catch (err) {
      addToast("Upload failed.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const lastClickedImg = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInteraction = (e: MouseEvent | KeyboardEvent) => {
      saveSelection();

      // Manage Image Selection UI
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        lastClickedImg.current = target as HTMLImageElement;
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        target.style.outline = "8px solid #EAB308";
        target.style.outlineOffset = "4px";
      } else if (e.type === "click") {
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        lastClickedImg.current = null;
      }
    };

    editor.addEventListener("click", handleInteraction);
    editor.addEventListener("keyup", handleInteraction);
    return () => {
      editor.removeEventListener("click", handleInteraction);
      editor.removeEventListener("keyup", handleInteraction);
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      editor.innerHTML = value || "<p><br></p>";
      if (history.current.length === 0) saveToHistory(value);
    }
  }, [value]);

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
      icon: List,
      action: () => document.execCommand("insertUnorderedList"),
      title: "List",
    },
    {
      icon: LinkIcon,
      action: () =>
        document.execCommand("createLink", false, prompt("URL:") || ""),
      title: "Link",
    },
    {
      icon: Trash2,
      action: () => {
        if (lastClickedImg.current) lastClickedImg.current.remove();
        else document.execCommand("delete");
        onChange(editorRef.current!.innerHTML);
      },
      title: "Delete",
      danger: true,
    },
  ];

  return (
    <div className="bg-white rounded-[64px] border-[16px] border-slate-50 shadow-2xl min-h-[1200px] relative transition-all duration-700 hover:shadow-gold/5 group/editor">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleDirectUpload}
      />

      {/* MEDIUM-STYLE FLOATING PLUS BUTTON */}
      {floatingMenuPos.visible && (
        <div
          className="absolute -left-16 transition-all duration-300 z-50 flex items-center gap-2"
          style={{ top: floatingMenuPos.top + 8 }}
        >
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
              showPlusMenu
                ? "bg-gold border-gold text-white rotate-45"
                : "bg-white border-slate-200 text-slate-400 hover:border-gold hover:text-gold"
            }`}
          >
            <Plus size={20} />
          </button>

          {showPlusMenu && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center hover:bg-gold transition-colors shadow-lg"
                title="Quick Upload"
              >
                <Upload size={18} />
              </button>
              <button
                type="button"
                onClick={onMediaButtonClick}
                className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center hover:bg-gold transition-colors shadow-lg"
                title="Media Library"
              >
                <Film size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Toolbar */}
      <div className="p-3 border border-slate-200/50 bg-white/95 backdrop-blur-3xl flex items-center flex-wrap gap-1 sticky top-6 z-40 mx-12 mt-12 rounded-[32px] shadow-2xl border border-white">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider")
            return <div key={index} className="w-px h-6 bg-slate-100 mx-2" />;
          const Icon = btn.icon!;
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                btn.action();
              }}
              title={btn.title}
              className={`p-3 rounded-2xl transition-all active:scale-50 ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-400 hover:bg-white hover:text-navy-950 hover:shadow-xl border border-transparent hover:border-slate-50"
              }`}
            >
              <Icon size={20} strokeWidth={2.5} />
            </button>
          );
        })}
        <div className="ml-auto flex gap-2 mr-2">
          {["25%", "50%", "100%"].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                if (lastClickedImg.current) {
                  lastClickedImg.current.style.width = size;
                  onChange(editorRef.current!.innerHTML);
                }
              }}
              className="px-3 py-1 text-[9px] font-black bg-slate-50 text-slate-500 rounded-lg hover:bg-gold hover:text-navy-950 transition-all border border-slate-100"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={editorRef}
        onInput={(e) => {
          const content = e.currentTarget.innerHTML;
          onChange(content);
          saveToHistory(content);
        }}
        contentEditable
        className="w-full min-h-[1000px] p-32 focus:outline-none prose prose-2xl max-w-none font-serif text-slate-800 prose-img:rounded-[4rem] prose-img:cursor-pointer prose-p:leading-relaxed prose-headings:font-black"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor_V5;
