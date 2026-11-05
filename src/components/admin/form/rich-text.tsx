"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4",
        active && "bg-brand-50 text-brand-700",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const c = () => editor.chain().focus();
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL link (kosongkan untuk menghapus)", prev ?? "https://");
    if (url === null) return;
    if (url === "") c().extendMarkRange("link").unsetLink().run();
    else c().extendMarkRange("link").setLink({ href: url }).run();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
      <ToolbarButton label="Tebal" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Miring" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Coret" active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}>
        <Strikethrough />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton label="Daftar" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>
        <List />
      </ToolbarButton>
      <ToolbarButton label="Daftar bernomor" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton label="Kutipan" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>
        <Quote />
      </ToolbarButton>
      <ToolbarButton label="Garis" onClick={() => c().setHorizontalRule().run()}>
        <Minus />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton label="Hapus link" onClick={() => c().unsetLink().run()}>
          <Unlink />
        </ToolbarButton>
      )}
      <span className="flex-1" />
      <ToolbarButton label="Undo" onClick={() => c().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => c().redo().run()}>
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { id: id ?? "", class: "prose-cms min-h-40 px-3 py-2 outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sinkronkan bila nilai diubah dari luar (mis. reset form).
  useEffect(() => {
    if (editor && !editor.isFocused && (value || "") !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input", invalid && "border-destructive")}>
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
