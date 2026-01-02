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

      // Update last selection after insertion
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
    { icon: Bold, action: () => execCmd("bold"), title: "Bold" },
    { icon: Italic, action: () => execCmd("italic"), title: "Italic" },
    { icon: Underline, action: () => execCmd("underline"), title: "Underline" },
    { icon: Pilcrow, action: () => formatBlock("p"), title: "Paragraph" },
    { icon: Heading2, action: () => formatBlock("h2"), title: "Heading 2" },
    { icon: Heading3, action: () => formatBlock("h3"), title: "Heading 3" },
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
    { icon: LinkIcon, action: createLink, title: "Link" },
    { icon: Film, action: onMediaButtonClick, title: "Insert Media" },
  ];

  return (
    <div className="bg-white rounded-md border border-gray-300">
      <div className="p-2 border-b border-gray-300 bg-gray-50 rounded-t-md flex items-center flex-wrap gap-1">
        {toolbarButtons.map((btn, index) => (
          <button
            key={index}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="p-2 rounded-md hover:bg-gray-200 text-gray-600"
            onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus on click
          >
            <btn.icon size={16} />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        onInput={handleInput}
        onBlur={handleBlur}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        contentEditable
        className="w-full h-96 p-4 focus:outline-none overflow-y-auto prose prose-lg max-w-none font-serif text-black prose-headings:font-bold prose-headings:text-black prose-p:text-gray-800 prose-ul:list-disc prose-ul:pl-4 prose-a:text-blue-600 prose-li:text-gray-800"
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
});

export default WYSIWYGEditor;
