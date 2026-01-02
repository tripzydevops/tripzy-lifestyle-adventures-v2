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
  const historyTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Manual History ---
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);

  const saveToHistory = (content: string, immediate = false) => {
    const performSave = () => {
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

    if (historyTimer.current) clearTimeout(historyTimer.current);

    if (immediate) {
      performSave();
    } else {
      historyTimer.current = setTimeout(performSave, 500);
    }
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

  // --- Selection Marker Logic ---
  const MARKER_ID = "selection-marker-tripzy";

  const placeMarker = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    const existing = editorRef.current.querySelector(`#${MARKER_ID}`);
    if (existing) existing.remove();

    const marker = document.createElement("span");
    marker.id = MARKER_ID;
    marker.style.display = "none";
    range.insertNode(marker);
    lastSelection.current = range.cloneRange();
  };

  const removeMarker = () => {
    const marker = editorRef.current?.querySelector(`#${MARKER_ID}`);
    if (marker) marker.remove();
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      editor.innerHTML = value;
      if (history.current.length === 0) saveToHistory(value, true);
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const marker = editor.querySelector(`#${MARKER_ID}`);

      if (marker) {
        const div = document.createElement("div");
        div.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (div.firstChild) fragment.appendChild(div.firstChild);
        marker.parentNode?.replaceChild(fragment, marker);
      } else {
        const sel = window.getSelection();
        if (lastSelection.current && sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(lastSelection.current);
          } catch (e) {}
        }
        document.execCommand("insertHTML", false, html);
      }

      const freshContent = editor.innerHTML;
      onChange(freshContent);
      saveToHistory(freshContent, true);
      removeMarker();
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
      // Explicitly remove the selected image
      lastClickedImg.current.remove();
      lastClickedImg.current = null;
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        saveToHistory(editorRef.current.innerHTML, true);
      }
    } else {
      // Fallback to browser delete for text
      document.execCommand("delete", false);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        saveToHistory(editorRef.current.innerHTML, true);
      }
    }
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
    editorRef.current?.focus();
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      saveToHistory(content, true);
    }
  };

  const handleMediaClick = () => {
    placeMarker();
    onMediaButtonClick();
  };

  const insertImageUrl = () => {
    const url = prompt("Paste the image URL:");
    if (url) {
      const html = `<img src="${url}" style="width: 100%; height: auto; border-radius: 2rem; display: block; margin: 3rem auto;" /><p><br></p>`;
      (ref as any).current.insertHtml(html);
    }
  };

  const createLink = () => {
    const url = prompt("Enter the URL:");
    if (url) execCmd("createLink", url);
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
        target.style.outline = "4px solid #EAB308";
        target.style.outlineOffset = "4px";
        target.style.boxShadow = "0 0 50px rgba(234, 179, 8, 0.4)";
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

  const setSize = (width: string) => {
    if (lastClickedImg.current) {
      lastClickedImg.current.style.width = width;
      lastClickedImg.current.style.height = "auto";
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        saveToHistory(editorRef.current.innerHTML, true);
      }
    }
  };

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
    { icon: LinkIcon, action: createLink, title: "Link" },
    { icon: ImagePlus, action: insertImageUrl, title: "Insert URL Image" },
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
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl min-h-[900px] relative transition-all duration-700 hover:shadow-gold/10">
      <div className="p-4 border-b border-gray-50 bg-white/95 backdrop-blur-2xl flex items-center flex-wrap gap-1 sticky top-6 z-40 mx-6 mt-6 rounded-[24px] shadow-xl border border-gray-100">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider")
            return <div key={index} className="w-px h-6 bg-gray-100 mx-2" />;
          if (btn.label)
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                className="px-4 py-1.5 text-[10px] font-black bg-slate-50 text-slate-600 rounded-xl hover:bg-gold hover:text-navy-950 transition-all shadow-sm active:scale-90 border border-slate-100"
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
              className={`p-2.5 rounded-2xl transition-all active:scale-75 ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-400 hover:bg-slate-50 hover:text-navy-950 hover:shadow-inner"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <Icon size={18} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        onInput={(e) => {
          const content = e.currentTarget.innerHTML;
          onChange(content);
          saveToHistory(content); // Debounced save
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
        contentEditable
        className="w-full min-h-[900px] p-20 focus:outline-none prose prose-2xl max-w-none font-serif text-slate-800 prose-img:rounded-[3rem] prose-img:cursor-pointer prose-img:transition-all prose-img:duration-700 prose-img:shadow-2xl hover:prose-img:scale-[1.02] prose-p:leading-relaxed prose-headings:font-black"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor;
