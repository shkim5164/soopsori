"use client";

import { useState } from "react";
import { updateClass } from "../../actions";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

interface EditClassFormProps {
  classItem: {
    id: string;
    title: string;
    content: string;
    capacity: number;
    deadline: Date;
  };
}

export default function EditClassForm({ classItem }: EditClassFormProps) {
  const [content, setContent] = useState(classItem.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // datetime-local input requires "YYYY-MM-DDThh:mm" format
  const formatForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("content", content);
      await updateClass(classItem.id, formData);
    } catch (error) {
      console.error(error);
      alert("클래스 수정 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/classes/${classItem.id}`} className="text-sm font-bold hover:underline mb-4 inline-block">
          &larr; 취소
        </Link>
        <h1 className="text-3xl font-black text-black">클래스 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 neo-card p-6">
        <div>
          <label className="block text-sm font-black mb-2 text-black">클래스 제목</label>
          <input
            type="text"
            name="title"
            required
            defaultValue={classItem.title}
            className="w-full px-4 py-3 rounded-none bg-white border-2 border-black text-black font-bold focus:outline-none focus:bg-neo-yellow transition-colors shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black mb-2 text-black">정원 (명)</label>
            <input
              type="number"
              name="capacity"
              required
              min="1"
              defaultValue={classItem.capacity}
              className="w-full px-4 py-3 rounded-none bg-white border-2 border-black text-black font-bold focus:outline-none focus:bg-neo-yellow transition-colors shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]"
            />
          </div>

          <div>
            <label className="block text-sm font-black mb-2 text-black">모집 마감일</label>
            <input
              type="datetime-local"
              name="deadline"
              required
              defaultValue={formatForInput(classItem.deadline)}
              className="w-full px-4 py-3 rounded-none bg-white border-2 border-black text-black font-bold focus:outline-none focus:bg-neo-yellow transition-colors shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-black mb-2 text-black">클래스 내용 (사진 포함 가능)</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="클래스 커리큘럼, 준비물 등을 자세히 적어주세요."
          />
        </div>

        <div className="pt-4 border-t-2 border-black flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 neo-btn neo-btn-primary font-black disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
