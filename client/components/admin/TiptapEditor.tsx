"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Terminal,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  UnderlineIcon,
  Link2,
  Link2Off,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
} from "lucide-react";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // HorizontalRule already in StarterKit; keep default behaviour
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { class: "tiptap-link", rel: "noopener noreferrer", target: "_blank" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Typography,
      Placeholder.configure({ placeholder: "Start writing your article here…" }),
    ],
    editorProps: {
      attributes: {
        class:
          "blog-prose tiptap h-[68vh] w-full max-w-full rounded-b-lg border border-t-0 border-border bg-card p-6 text-foreground overflow-y-auto focus:outline-none",
      },
      // Strip AI-tool junk: font-family / font-size / color inline styles while keeping structural formatting
      transformPastedHTML(html) {
        return html
          .replace(/style="[^"]*font-family[^"]*"/gi, "")
          .replace(/style="[^"]*font-size[^"]*"/gi, "")
          .replace(/<span\s*>/gi, "")
          .replace(/<\/span>/gi, "");
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content if it changes externally (e.g. after loading data in edit mode)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleSetLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previous ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  type ToolbarButton = {
    icon: React.ElementType;
    label: string;
    isActive: () => boolean;
    onClick: () => void;
  };

  type ToolbarSeparator = { separator: true };

  const toolbarItems: (ToolbarButton | ToolbarSeparator)[] = [
    {
      icon: Bold,
      label: "Bold",
      isActive: () => editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      isActive: () => editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: UnderlineIcon,
      label: "Underline",
      isActive: () => editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: Highlighter,
      label: "Highlight",
      isActive: () => editor.isActive("highlight"),
      onClick: () => editor.chain().focus().toggleHighlight().run(),
    },
    { separator: true },
    {
      icon: Heading2,
      label: "H2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Heading3,
      label: "H3",
      isActive: () => editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    { separator: true },
    {
      icon: AlignLeft,
      label: "Align Left",
      isActive: () => editor.isActive({ textAlign: "left" }),
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      icon: AlignCenter,
      label: "Align Center",
      isActive: () => editor.isActive({ textAlign: "center" }),
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      icon: AlignRight,
      label: "Align Right",
      isActive: () => editor.isActive({ textAlign: "right" }),
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
    },
    { separator: true },
    {
      icon: List,
      label: "Bullet List",
      isActive: () => editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      isActive: () => editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Blockquote",
      isActive: () => editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Minus,
      label: "Divider",
      isActive: () => false,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
    },
    { separator: true },
    {
      icon: Code,
      label: "Inline Code",
      isActive: () => editor.isActive("code"),
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: Terminal,
      label: "Code Block",
      isActive: () => editor.isActive("codeBlock"),
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    { separator: true },
    {
      icon: Link2,
      label: "Set Link",
      isActive: () => editor.isActive("link"),
      onClick: handleSetLink,
    },
    {
      icon: Link2Off,
      label: "Remove Link",
      isActive: () => false,
      onClick: () => editor.chain().focus().unsetLink().run(),
    },
    { separator: true },
    {
      icon: Undo,
      label: "Undo",
      isActive: () => false,
      onClick: () => editor.chain().focus().undo().run(),
    },
    {
      icon: Redo,
      label: "Redo",
      isActive: () => false,
      onClick: () => editor.chain().focus().redo().run(),
    },
  ];

  const editorMarkup = (
    <div className={`flex flex-col w-full relative ${isFullScreen ? "fullscreen-editor" : ""}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between rounded-t-lg border border-border bg-muted/95 backdrop-blur-sm px-2 py-1.5 sticky top-0 z-10 editor-toolbar gap-1">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbarItems.map((item, i) => {
            if ("separator" in item) {
              return <span key={`sep-${i}`} className="w-px h-5 bg-border/60 mx-1 shrink-0" />;
            }
            const Icon = item.icon;
            const active = item.isActive();
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                title={item.label}
                className={`flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-background/60 active:scale-95 ${
                  active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-background/60 active:scale-95 text-muted-foreground hover:text-foreground shrink-0"
        >
          {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <EditorContent editor={editor} />

      <style dangerouslySetInnerHTML={{ __html: `
        /* Fullscreen mode layout */
        .fullscreen-editor {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99999 !important;
          background-color: hsl(var(--background)) !important;
          padding: 0 !important;
          height: 100vh !important;
          width: 100vw !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        .fullscreen-editor > div:not(.editor-toolbar) {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
        }
        .fullscreen-editor .tiptap {
          flex: 1 !important;
          height: 100% !important;
          border-radius: 0 !important;
          border: none !important;
          padding: 2.5rem !important;
          box-sizing: border-box !important;
          overflow-y: auto !important;
        }
        .fullscreen-editor .editor-toolbar {
          border-radius: 0 !important;
          border: none !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }
      ` }} />
    </div>
  );

  if (isFullScreen && mounted) {
    return createPortal(editorMarkup, document.body);
  }

  return editorMarkup;
}
