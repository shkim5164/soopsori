"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full rounded-md border-2 border-black my-4 object-cover',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[200px] p-4 text-black font-bold',
      },
    },
  });

  // Handle external value changes (like form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const res = await fetch("/api/upload?folder=reviews", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        editor?.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  if (!editor || !mounted) {
    return null;
  }

  return (
    <div className="border-2 border-black bg-white text-black mb-3">
      {/* Toolbar */}
      <div className="border-b-2 border-black p-2 bg-neo-yellow flex gap-2 flex-wrap items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-8 h-8 flex items-center justify-center border-2 border-black font-black text-sm bg-white hover:bg-neo-pink hover:text-black transition-colors ${editor.isActive('bold') ? 'bg-neo-pink text-black' : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-8 h-8 flex items-center justify-center border-2 border-black font-black text-sm bg-white hover:bg-neo-blue hover:text-black transition-colors ${editor.isActive('italic') ? 'bg-neo-blue text-black' : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`w-8 h-8 flex items-center justify-center border-2 border-black font-black text-sm bg-white hover:bg-neo-green hover:text-black transition-colors ${editor.isActive('strike') ? 'bg-neo-green text-black' : ''}`}
        >
          S
        </button>
        <div className="w-px h-6 bg-black mx-1 self-center"></div>
        <button
          type="button"
          onClick={handleImageUploadClick}
          disabled={isUploading}
          className="px-3 h-8 flex items-center justify-center border-2 border-black font-black text-xs bg-white hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "업로드 중..." : "📷 사진 추가"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder || "내용을 입력하세요"}';
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
