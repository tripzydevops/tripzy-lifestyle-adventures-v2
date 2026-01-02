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

  // --- Manual History Engine ---
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isInternalUpdate = useRef<boolean>(false);

  const saveToHistory = (content: string) => {
    // Don't save if identical to current position
    if (
      historyIndex.current >= 0 &&
      history.current[historyIndex.current] === content
    )
      return;

    // Truncate future if we are in the middle of undoing
    const newHistory = history.current.slice(0, historyIndex.current + 1);
    newHistory.push(content);

    // Limit history size to 50 steps
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

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && !isInternalUpdate.current) {
      editor.innerHTML = value;
      // Initialize history if empty
      if (history.current.length === 0) {
        saveToHistory(value);
      }
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const selection = window.getSelection();

      // If we have a saved selection, restore it with extra care
      if (lastSelection.current && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(lastSelection.current);
        } catch (e) {
          console.warn("Selection restoration failed, falling back...");
        }
      }

      // Modern insertion approach using Range API
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Ensure range is inside editor
        if (editor.contains(range.commonAncestorContainer)) {
          range.deleteContents();

          const div = document.createElement("div");
          div.innerHTML = html;
          const fragment = document.createDocumentFragment();
          let lastNode;
          while (div.firstChild) {
            lastNode = fragment.appendChild(div.firstChild);
          }
          range.insertNode(fragment);

          // Move cursor to after the inserted content
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
        // Fallback to execCommand if range logic fails
        document.execCommand("insertHTML", false, html);
      }

      const newContent = editor.innerHTML;
      onChange(newContent);
      saveToHistory(newContent);
    },
  }));

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isInternalUpdate.current) return;
    const content = e.currentTarget.innerHTML;
    onChange(content);
    saveToHistory(content);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Ensure the range is actually inside the editor
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        lastSelection.current = range.cloneRange();
      }
    }
  };

  const handleBlur = () => {
    saveSelection();
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

    document.execCommand(command, false, valueArg);
    editorRef.current?.focus();
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
      saveToHistory(newContent);
    }
  };

  const insertImageUrl = () => {
    saveSelection();
    const url = prompt(
      "Paste the image URL (e.g., https://example.com/photo.jpg):"
    );
    if (url) {
      const html = `<img src="${url}" alt="External Image" style="width: 100%; height: auto; border-radius: 1.5rem; display: block; margin: 2.5rem auto;" /><p><br></p>`;
      const editor = (ref as any).current;
      if (editor) {
        editor.insertHtml(html);
      }
    }
  };

  const createLink = () => {
    saveSelection();
    const url = prompt("Enter the URL:");
    if (url) {
      const selection = window.getSelection();
      if (lastSelection.current && selection) {
        selection.removeAllRanges();
        selection.addRange(lastSelection.current);
      }
      execCmd("createLink", url);
    }
  };

  const formatBlock = (tag: string) => {
    execCmd("formatBlock", tag);
  };

  const lastClickedImg = useRef<HTMLImageElement | null>(null);

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
        target.style.boxShadow = "0 0 40px rgba(234, 179, 8, 0.3)";
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
        saveToHistory(editorRef.current.innerHTML);
      }
    } else {
      console.warn("Click an image first to resize it");
    }
  };

  const toolbarButtons = [
    { icon: Undo2, action: () => execCmd("undo"), title: "Undo" },
    { icon: Redo2, action: () => execCmd("redo"), title: "Redo" },
    { type: "divider" },
    { icon: Bold, action: () => execCmd("bold"), title: "Bold" },
    { icon: Italic, action: () => execCmd("italic"), title: "Italic" },
    { icon: Underline, action: () => execCmd("underline"), title: "Underline" },
    { type: "divider" },
    { icon: Pilcrow, action: () => formatBlock("p"), title: "Paragraph" },
    { icon: Heading2, action: () => formatBlock("h2"), title: "Heading 2" },
    { icon: Heading3, action: () => formatBlock("h3"), title: "Heading 3" },
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
    { icon: Film, action: onMediaButtonClick, title: "Media Library" },
    { type: "divider" },
    { label: "S", action: () => setSize("25%"), title: "Small (25%)" },
    { label: "M", action: () => setSize("50%"), title: "Medium (50%)" },
    { label: "L", action: () => setSize("75%"), title: "Large (75%)" },
    { label: "Full", action: () => setSize("100%"), title: "Full Width" },
    { type: "divider" },
    {
      icon: Trash2,
      action: () => execCmd("delete"),
      title: "Delete Selection",
      danger: true,
    },
  ];

  return (
    <div className="bg-white rounded-[40px] border border-gray-200 shadow-2xl group/editor transition-all duration-500 hover:border-gold/30 min-h-[900px] relative">
      <div className="p-4 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xl flex items-center flex-wrap gap-1.5 sticky top-4 z-30 mx-4 mt-4 rounded-2xl shadow-lg border border-gray-200/50">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider") {
            return (
              <div
                key={`divider-${index}`}
                className="w-px h-6 bg-gray-200 mx-2"
              />
            );
          }
          if (btn.label) {
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className="px-3 py-1.5 text-[10px] font-bold bg-white border border-gray-200 text-slate-600 rounded-xl hover:bg-gold hover:border-gold hover:text-navy-950 transition-all shadow-sm active:scale-90"
              >
                {btn.label}
              </button>
            );
          }
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
                  : "text-slate-400 hover:bg-white hover:text-navy-950 hover:shadow-md hover:border-gray-100 border border-transparent"
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
        onInput={handleInput}
        onBlur={handleBlur}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        contentEditable
        className="w-full min-h-[900px] p-16 focus:outline-none overflow-y-auto prose prose-2xl max-w-none font-serif text-slate-800 prose-img:rounded-[2.5rem] prose-img:cursor-pointer prose-img:transition-all prose-img:duration-500 prose-img:border-8 prose-img:border-transparent hover:prose-img:border-gold/10 prose-p:leading-relaxed prose-headings:font-bold"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor;
