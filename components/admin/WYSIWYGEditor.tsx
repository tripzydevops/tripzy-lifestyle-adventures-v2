import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
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
} from "lucide-react";
import { uploadService } from "../../services/uploadService";
import { useToast } from "../../hooks/useToast";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMediaButtonClick: () => void;
}

const WYSIWYGEditor_V4 = forwardRef<
  { insertHtml: (html: string) => void },
  WYSIWYGEditorProps
>(({ value, onChange, onMediaButtonClick }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelection = useRef<Range | null>(null);
  const isInternalUpdate = useRef<boolean>(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- Robust Insertion Logic ---
  const insertHtmlAtSelection = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const sel = window.getSelection();

    // We force restoration of the LAST KNOWN good click spot
    if (lastSelection.current && sel) {
      sel.removeAllRanges();
      sel.addRange(lastSelection.current);
    }

    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();

        const div = document.createElement("div");
        div.innerHTML = html;
        const fragment = document.createDocumentFragment();
        let lastNode;
        while (div.firstChild) lastNode = fragment.appendChild(div.firstChild);
        range.insertNode(fragment);

        // Auto-insert a paragraph AFTER the photo to ensure clickability
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        if (lastNode && lastNode.parentNode) {
          lastNode.parentNode.insertBefore(p, lastNode.nextSibling);
        }

        // Selection remains at the new line
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.setEnd(p, 0);
        sel.removeAllRanges();
        sel.addRange(newRange);
        lastSelection.current = newRange.cloneRange();
      }
    } else {
      // Ultimate Fallback: Just append if we have no clue where to go
      editor.innerHTML += html;
    }

    const freshContent = editor.innerHTML;
    onChange(freshContent);
    saveToHistory(freshContent);
  };

  useImperativeHandle(ref, () => ({
    insertHtml: insertHtmlAtSelection,
  }));

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        lastSelection.current = range.cloneRange();
      }
    }
  };

  const deleteAction = () => {
    if (lastClickedImg.current) {
      lastClickedImg.current.remove();
      lastClickedImg.current = null;
    } else {
      document.execCommand("delete", false);
    }
    const content = editorRef.current?.innerHTML || "";
    onChange(content);
    saveToHistory(content);
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast("Uploading directly to your story...", "info");
    try {
      const { url } = await uploadService.uploadFile(file);
      // We wrap the image in a block to make it more 'clickable' on either side
      const html = `<div class="media-block" style="margin: 4rem 0; width: 100%;"><img src="${url}" style="width: 100%; height: auto; border-radius: 4rem; display: block; box-shadow: 0 40px 100px rgba(0,0,0,0.2);" /></div>`;
      insertHtmlAtSelection(html);
      addToast("Photo placed!", "success");
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

    // Fix: Clicking an image should definitively focus its spot
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        lastClickedImg.current = target as HTMLImageElement;
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        target.style.outline = "8px solid #EAB308";
        target.style.outlineOffset = "4px";
        saveSelection(); // Locking this spot
      } else {
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        lastClickedImg.current = null;
        saveSelection();
      }
    };
    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      // Use hidden spans to ensure empty lines stay clickable
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
      icon: Pilcrow,
      action: () => document.execCommand("formatBlock", false, "p"),
      title: "Paragraph",
    },
    {
      icon: Heading2,
      action: () => document.execCommand("formatBlock", false, "h2"),
      title: "Heading 2",
    },
    {
      icon: Heading3,
      action: () => document.execCommand("formatBlock", false, "h3"),
      title: "Heading 3",
    },
    { type: "divider" },
    {
      icon: LinkIcon,
      action: () =>
        document.execCommand("createLink", false, prompt("URL:") || ""),
      title: "Link",
    },
    {
      icon: Upload,
      action: () => fileInputRef.current?.click(),
      title: "Direct Upload",
    },
    { icon: Film, action: onMediaButtonClick, title: "Media Library" },
    { type: "divider" },
    {
      label: "S",
      action: () => {
        if (lastClickedImg.current) lastClickedImg.current.style.width = "25%";
        onChange(editorRef.current!.innerHTML);
      },
    },
    {
      label: "M",
      action: () => {
        if (lastClickedImg.current) lastClickedImg.current.style.width = "50%";
        onChange(editorRef.current!.innerHTML);
      },
    },
    {
      label: "Full",
      action: () => {
        if (lastClickedImg.current) lastClickedImg.current.style.width = "100%";
        onChange(editorRef.current!.innerHTML);
      },
    },
    { type: "divider" },
    { icon: Trash2, action: deleteAction, title: "Delete", danger: true },
  ];

  return (
    <div className="bg-white rounded-[64px] border-[12px] border-slate-50 shadow-2xl min-h-[1200px] relative overflow-visible group/editor transition-shadow hover:shadow-gold/5">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleDirectUpload}
      />

      {/* Floating Toolbar */}
      <div className="p-3 border border-slate-200/50 bg-white/95 backdrop-blur-3xl flex items-center flex-wrap gap-1.5 sticky top-8 z-50 mx-10 mt-10 rounded-[32px] shadow-[0_32px_100px_-20px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-700">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider")
            return <div key={index} className="w-px h-8 bg-slate-100 mx-2" />;
          if (btn.label)
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                className="px-5 py-2 text-[11px] font-black bg-slate-50 text-slate-900 rounded-2xl hover:bg-gold hover:text-navy-950 transition-all active:scale-90 border border-slate-100/50 uppercase tracking-widest shadow-sm"
              >
                {btn.label}
              </button>
            );
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
              className={`p-3.5 rounded-[20px] transition-all active:scale-50 ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50 hover:shadow-inner"
                  : "text-slate-400 hover:bg-white hover:text-navy-950 hover:shadow-xl hover:border-slate-100 border border-transparent"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <Icon size={22} strokeWidth={3} />
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        onInput={(e) => {
          const content = e.currentTarget.innerHTML;
          onChange(content);
          saveToHistory(content);
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
        contentEditable
        className="w-full min-h-[1000px] p-32 focus:outline-none prose prose-2xl max-w-none font-serif text-slate-800 prose-img:rounded-[4rem] prose-img:cursor-pointer prose-img:transition-all prose-img:duration-1000 hover:prose-img:scale-[1.01] prose-p:leading-relaxed prose-p:mb-8 prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900 cursor-text"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor_V4;
