"use client";

import { useState } from "react";
import { createClass } from "../actions";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

export default function NewClassPage() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("content", content);
      await createClass(formData);
    } catch (error) {
      console.error(error);
      alert("클래스 개설 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/classes" className="text-sm font-bold hover:underline mb-4 inline-block">
          &larr; 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-black text-black">클래스 개설</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 neo-card p-6">
        <div>
          <label className="block text-sm font-black mb-2 text-black">클래스 제목</label>
          <input
            type="text"
            name="title"
            required
            className="w-full px-4 py-3 rounded-none bg-white border-2 border-black text-black font-bold focus:outline-none focus:bg-neo-yellow transition-colors shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]"
            placeholder="예: 초보자를 위한 일렉기타 속성반"
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
              className="w-full px-4 py-3 rounded-none bg-white border-2 border-black text-black font-bold focus:outline-none focus:bg-neo-yellow transition-colors shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]"
              placeholder="예: 5"
            />
          </div>

          <div>
            <label className="block text-sm font-black mb-2 text-black">모집 마감일</label>
            <input
              type="datetime-local"
              name="deadline"
              required
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
            {isSubmitting ? "개설 중..." : "클래스 개설하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
