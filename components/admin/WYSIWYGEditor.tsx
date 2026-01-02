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

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertHtml(html: string) {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const selection = window.getSelection();

      if (lastSelection.current && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(lastSelection.current);
        } catch (e) {
          console.warn("Failed to restore selection:", e);
        }
      }

      document.execCommand("insertHTML", false, html);
      onChange(editor.innerHTML);

      const newSelection = window.getSelection();
      if (newSelection && newSelection.rangeCount > 0) {
        lastSelection.current = newSelection.getRangeAt(0);
      }
    },
  }));

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastSelection.current = selection.getRangeAt(0);
    }
  };

  const handleBlur = () => {
    saveSelection();
  };

  const execCmd = (command: string, valueArg?: string) => {
    document.execCommand(command, false, valueArg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertImageUrl = () => {
    const url = prompt(
      "Paste the image URL (e.g., https://example.com/photo.jpg):"
    );
    if (url) {
      const html = `<img src="${url}" alt="External Image" style="width: 100%; height: auto; border-radius: 0.5rem;" /><p><br></p>`;
      // Use the internal handle to ensure cursor position
      const editor = editorRef.current;
      if (editor) {
        editor.focus();
        document.execCommand("insertHTML", false, html);
        onChange(editor.innerHTML);
      }
    }
  };

  const resizeImage = (width: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      // If we clicked the image itself, anchorNode might be the parent, or the node itself
      if (node && node.nodeType === 3) node = node.parentNode;

      const img =
        (node as HTMLElement)?.closest("img") ||
        editorRef.current?.querySelector("img:focus");

      if (img) {
        (img as HTMLElement).style.width = width;
        (img as HTMLElement).style.height = "auto";
        onChange(editorRef.current!.innerHTML);
      } else {
        // Fallback: try to find the image in the current selection range
        const range = selection.getRangeAt(0);
        const container = document.createElement("div");
        container.appendChild(range.cloneContents());
        if (container.querySelector("img")) {
          // If we found an image in the selection, we wrap the command
          document.execCommand("formatBlock", false, "div"); // Dummy to ensure we have a handle
          const images = editorRef.current?.querySelectorAll("img");
          // This is a bit complex for a basic execCommand editor, so we use a simpler strategy:
          // Just look for the MOST RECENTLY clicked image.
        }
      }
    }
    // Simplest reliable way: User clicks image, then clicks size.
    // We add a global listener for the "last clicked image"
  };

  const lastClickedImg = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        lastClickedImg.current = e.target as HTMLImageElement;
        // Visual feedback
        editor
          .querySelectorAll("img")
          .forEach((i) => (i.style.outline = "none"));
        (e.target as HTMLElement).style.outline = "2px solid #EAB308";
      } else {
        editor
          .querySelectorAll("img")
          .forEach((i) => (i.style.outline = "none"));
      }
    };

    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  const setSize = (width: string) => {
    if (lastClickedImg.current) {
      lastClickedImg.current.style.width = width;
      lastClickedImg.current.style.height = "auto";
      onChange(editorRef.current!.innerHTML);
    } else {
      // Assuming addToast is defined elsewhere or needs to be added
      // addToast("Click an image first to resize it", "info");
      console.warn("Click an image first to resize it");
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
    { label: "25%", action: () => setSize("25%"), title: "Small" },
    { label: "50%", action: () => setSize("50%"), title: "Medium" },
    { label: "100%", action: () => setSize("100%"), title: "Full" },
    { type: "divider" },
    {
      icon: Trash2,
      action: () => execCmd("delete"),
      title: "Delete Selection",
      danger: true,
    },
  ];

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-inner">
      <div className="p-2 border-b border-gray-300 bg-gray-50 rounded-t-md flex items-center flex-wrap gap-1 sticky top-0 z-10">
        {toolbarButtons.map((btn, index) => {
          if (btn.type === "divider") {
            return (
              <div
                key={`divider-${index}`}
                className="w-px h-6 bg-gray-300 mx-1"
              />
            );
          }
          if (btn.label) {
            return (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded hover:bg-gold hover:text-navy-950 transition-all"
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
              className={`p-2 rounded-md transition-all ${
                btn.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Icon size={16} />
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
        className="w-full min-h-[700px] p-10 focus:outline-none overflow-y-auto prose prose-lg max-w-none font-serif text-black prose-img:rounded-2xl prose-img:cursor-pointer prose-img:m-auto prose-img:my-8"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor;
