import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Image as ImageIcon, Undo2, Redo2, Minus,
} from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';

interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export interface RichTextEditorRef {
  getHTML: () => string;
  clear: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content = '', placeholder = 'Écrivez ici...', onChange, onImageUpload }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      clear: () => editor?.commands.clearContent(),
    }));

    useEffect(() => {
      if (editor && content && editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }, [content]);

    const handleImageInsert = useCallback(async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file || !editor) return;

        if (onImageUpload) {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } else {
          // Fallback: convert to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            editor.chain().focus().setImage({ src: base64 }).run();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }, [editor, onImageUpload]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !editor) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          if (onImageUpload) {
            onImageUpload(file).then((url) => {
              editor.chain().focus().setImage({ src: url }).run();
            });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              editor.chain().focus().setImage({ src: reader.result as string }).run();
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }, [editor, onImageUpload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || !editor) return;

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          if (onImageUpload) {
            onImageUpload(file).then((url) => {
              editor.chain().focus().setImage({ src: url }).run();
            });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              editor.chain().focus().setImage({ src: reader.result as string }).run();
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }, [editor, onImageUpload]);

    if (!editor) return null;

    return (
      <div className="border border-[--k-border] rounded-xl overflow-hidden bg-[--k-surface] transition">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[--k-border] bg-[--k-surface-2] flex-wrap">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Gras"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italique"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Souligné"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="w-px h-4 bg-[--k-border] mx-1" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Liste à puces"
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Liste numérotée"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="w-px h-4 bg-[--k-border] mx-1" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Ligne horizontale"
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={handleImageInsert}
            title="Insérer une image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="flex-1" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>

        {/* Editor */}
        <div
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <EditorContent
            editor={editor}
            className="rte-content px-3 py-2 min-h-[120px] max-h-[300px] overflow-y-auto text-[13px] text-[--k-text] outline-none"
          />
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition ${
        active
          ? 'bg-[--k-primary] text-white'
          : disabled
            ? 'text-[--k-muted] opacity-40 cursor-not-allowed'
            : 'text-[--k-muted] hover:text-[--k-text] hover:bg-[--k-surface-2]'
      }`}
    >
      {children}
    </button>
  );
}
