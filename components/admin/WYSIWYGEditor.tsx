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
} from "lucide-react";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMediaButtonClick: () => void;
}

const WYSIWYGEditor = forwardRef<
  { insertHtml: (html: string) => void },
  WYSIWYGEditorProps
>(({ value, onChange, onMediaButtonClick }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelection = useRef<Range | null>(null);
  const isInternalUpdate = useRef<boolean>(false);

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

  // --- Placeholder Logic ---
  const PLACEHOLDER_ID = "tripzy-active-media-slot";

  const insertPlaceholder = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    // Remove any accidental twins
    editorRef.current
      .querySelectorAll(`#${PLACEHOLDER_ID}`)
      .forEach((e) => e.remove());

    const slot = document.createElement("div");
    slot.id = PLACEHOLDER_ID;
    slot.contentEditable = "false";
    slot.className =
      "my-8 p-12 border-4 border-dashed border-gold/40 rounded-[3rem] bg-gold/5 flex flex-col items-center justify-center gap-4 animate-pulse";
    slot.innerHTML = `
      <div class="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center text-gold">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </div>
      <p class="text-gold font-bold uppercase tracking-widest text-xs">Capturing travel assets...</p>
    `;

    range.deleteContents();
    range.insertNode(slot);

    // Sync with parent immediately so the placeholder survives re-renders
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
    saveToHistory(newContent);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      // We explicitly allow the innerHTML to update. If a placeholder is there, it's in the 'value' too.
      editor.innerHTML = value;
      if (history.current.length === 0) saveToHistory(value);
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      const editor = editorRef.current;
      if (!editor) return;

      const slot = editor.querySelector(`#${PLACEHOLDER_ID}`);
      if (slot) {
        const div = document.createElement("div");
        div.innerHTML = html;
        slot.parentNode?.replaceChild(div.firstElementChild || div, slot);
      } else {
        // Fallback for direct URL inserts
        editor.focus();
        document.execCommand("insertHTML", false, html);
      }

      const freshContent = editor.innerHTML;
      onChange(freshContent);
      saveToHistory(freshContent);
    },
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

  const lastClickedImg = useRef<HTMLImageElement | null>(null);

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

  const execCmd = (command: string, valueArg?: string) => {
    if (command === "undo") {
      undo();
      return;
    }
    if (command === "redo") {
      redo();
      return;
    }
    if (command === "delete") {
      deleteAction();
      return;
    }

    document.execCommand(command, false, valueArg);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      saveToHistory(content);
    }
  };

  const handleMediaClick = () => {
    insertPlaceholder();
    onMediaButtonClick();
  };

  const setSize = (width: string) => {
    if (lastClickedImg.current) {
      lastClickedImg.current.style.width = width;
      lastClickedImg.current.style.height = "auto";
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        saveToHistory(editorRef.current.innerHTML);
      }
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        lastClickedImg.current = target as HTMLImageElement;
        editor.querySelectorAll("img").forEach((i) => {
          (i as HTMLElement).style.outline = "none";
          (i as HTMLElement).style.boxShadow = "none";
        });
        target.style.outline = "6px solid #EAB308";
        target.style.outlineOffset = "4px";
        target.style.boxShadow = "0 0 60px rgba(234, 179, 8, 0.5)";
      } else {
        editor.querySelectorAll("img").forEach((i) => {
          (i as HTMLElement).style.outline = "none";
          (i as HTMLElement).style.boxShadow = "none";
        });
        lastClickedImg.current = null;
      }
    };

    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  const toolbarButtons = [
    { icon: Undo2, action: undo, title: "Undo" },
    { icon: Redo2, action: redo, title: "Redo" },
    { type: "divider" },
    { icon: Bold, action: () => execCmd("bold"), title: "Bold" },
    { icon: Italic, action: () => execCmd("italic"), title: "Italic" },
    { icon: Underline, action: () => execCmd("underline"), title: "Underline" },
    { type: "divider" },
    {
      icon: Pilcrow,
      action: () => execCmd("formatBlock", "p"),
      title: "Paragraph",
    },
    {
      icon: Heading2,
      action: () => execCmd("formatBlock", "h2"),
      title: "Heading 2",
    },
    {
      icon: Heading3,
      action: () => execCmd("formatBlock", "h3"),
      title: "Heading 3",
    },
    { type: "divider" },
    {
      icon: List,
      action: () => execCmd("insertUnorderedList"),
      title: "Unordered List",
    },
    {
      icon: ListOrdered,
      action: () => execCmd("insertOrderedList"),
      title: "Ordered List",
    },
    { type: "divider" },
    {
      icon: LinkIcon,
      action: () => execCmd("createLink", prompt("URL:") || ""),
      title: "Link",
    },
    {
      icon: ImagePlus,
      action: () =>
        (ref as any).current.insertHtml(
          `<img src="${prompt(
            "URL:"
          )}" style="width: 100%; border-radius: 2rem;"/>`
        ),
      title: "Insert URL Image",
    },
    { icon: Film, action: handleMediaClick, title: "Media Library" },
    { type: "divider" },
    { label: "S", action: () => setSize("25%"), title: "Small" },
    { label: "M", action: () => setSize("50%"), title: "Medium" },
    { label: "L", action: () => setSize("75%"), title: "Large" },
    { label: "Full", action: () => setSize("100%"), title: "Full" },
    { type: "divider" },
    {
      icon: Trash2,
      action: () => execCmd("delete"),
      title: "Delete",
      danger: true,
    },
  ];

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl min-h-[1000px] relative">
      <div className="p-4 border-b border-gray-50 bg-white/95 backdrop-blur-2xl flex items-center flex-wrap gap-1 sticky top-6 z-40 mx-4 mt-4 rounded-[28px] shadow-2xl border border-gray-200/50">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider")
            return <div key={index} className="w-px h-8 bg-gray-200 mx-2" />;
          if (btn.label)
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                className="px-4 py-2 text-[10px] font-black bg-slate-50 text-slate-600 rounded-2xl hover:bg-gold hover:text-navy-950 transition-all shadow-sm active:scale-90 border border-slate-100 uppercase tracking-tighter"
              >
                {btn.label}
              </button>
            );
          const Icon = btn.icon!;
          return (
            <button
              key={index}
              type="button"
              onClick={btn.action}
              title={btn.title}
              className={`p-3 rounded-2xl transition-all active:scale-75 ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-navy-950 hover:shadow-inner"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <Icon size={20} strokeWidth={2.5} />
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
        className="w-full min-h-[1000px] p-24 focus:outline-none prose prose-2xl max-w-none font-serif text-slate-900 prose-img:rounded-[3rem] prose-img:cursor-pointer prose-img:transition-all prose-img:duration-700 hover:prose-img:scale-[1.01] prose-p:leading-loose prose-headings:font-black"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor;
