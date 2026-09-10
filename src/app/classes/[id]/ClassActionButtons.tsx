"use client";

import { useState } from "react";
import { deleteClass } from "../actions";
import Link from "next/link";

export default function ClassActionButtons({ classId }: { classId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말로 이 클래스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClass(classId);
    } catch (error: any) {
      if (error?.message === "NEXT_REDIRECT" || error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      console.error(error);
      alert(error.message || "삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 sm:mt-0">
      <Link
        href={`/classes/${classId}/edit`}
        className="px-4 py-2 text-sm font-black bg-white border-2 border-black text-black hover:bg-neo-yellow transition-colors shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      >
        수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-2 text-sm font-black bg-white border-2 border-black text-danger-500 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
