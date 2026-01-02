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

const WYSIWYGEditor_V3 = forwardRef<
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

  // --- Modern Insertion Logic ---
  const insertHtmlAtSelection = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const sel = window.getSelection();

    // Restore selection if lost
    if (lastSelection.current && sel && !editor.contains(sel.anchorNode)) {
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

        // Select after the insert
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.setEndAfter(lastNode);
          sel.removeAllRanges();
          sel.addRange(newRange);
          lastSelection.current = newRange.cloneRange();
        }
      }
    } else {
      document.execCommand("insertHTML", false, html);
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

    addToast("Uploading directly to post...", "info");
    try {
      const { url } = await uploadService.uploadFile(file);
      const html = `<img src="${url}" style="width: 100%; height: auto; border-radius: 2rem; display: block; margin: 3rem auto;" /><p><br></p>`;
      insertHtmlAtSelection(html);
      addToast("Image uploaded!", "success");
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

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        lastClickedImg.current = target as HTMLImageElement;
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        target.style.outline = "6px solid #EAB308";
        target.style.outlineOffset = "4px";
      } else {
        editor
          .querySelectorAll("img")
          .forEach((i) => ((i as HTMLElement).style.outline = "none"));
        lastClickedImg.current = null;
      }
    };
    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      editor.innerHTML = value;
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
      icon: List,
      action: () => document.execCommand("insertUnorderedList"),
      title: "Unordered List",
    },
    {
      icon: ListOrdered,
      action: () => document.execCommand("insertOrderedList"),
      title: "Ordered List",
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
    <div className="bg-white rounded-[48px] border-4 border-slate-100 shadow-2xl min-h-[1000px] relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleDirectUpload}
      />
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 backdrop-blur-3xl flex items-center flex-wrap gap-1.5 sticky top-8 z-50 mx-6 mt-6 rounded-[32px] shadow-2xl border border-white">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider")
            return <div key={index} className="w-px h-8 bg-slate-200 mx-2" />;
          if (btn.label)
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                className="px-4 py-2 text-[10px] font-black bg-white text-slate-800 rounded-2xl hover:bg-gold hover:text-navy-950 transition-all shadow-sm active:scale-90 border border-slate-100 italic"
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
              className={`p-3 rounded-[18px] transition-all active:scale-50 ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50 shadow-sm"
                  : "text-slate-400 hover:bg-white hover:text-navy-950 hover:shadow-xl hover:border-slate-100 border border-transparent"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <Icon size={22} strokeWidth={2.5} />
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
        className="w-full min-h-[1000px] p-24 focus:outline-none prose prose-2xl max-w-none font-serif text-slate-900 prose-img:rounded-[3.5rem] prose-img:cursor-pointer prose-img:transition-all prose-img:duration-700 hover:prose-img:scale-[1.01] prose-p:leading-loose prose-headings:font-black"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor_V3;
