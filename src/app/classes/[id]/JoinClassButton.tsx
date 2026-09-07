"use client";

import { useState } from "react";
import { joinClass, cancelJoinClass } from "../actions";
import { useRouter } from "next/navigation";

export default function JoinClassButton({ classId, disabled, label, isJoined }: { classId: string, disabled: boolean, label: string, isJoined?: boolean }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    if (disabled && !isJoined) return;
    
    setIsProcessing(true);
    try {
      if (isJoined) {
        if (confirm("정말로 클래스 참가를 취소하시겠습니까?")) {
          await cancelJoinClass(classId);
          alert("참가 신청이 취소되었습니다.");
        }
      } else {
        await joinClass(classId);
        alert("클래스 참가 신청이 완료되었습니다!");
      }
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={(disabled && !isJoined) || isProcessing}
      className={`w-full py-4 text-lg font-black transition-all ${
        (disabled && !isJoined)
          ? "bg-gray-300 border-2 border-black text-gray-500 cursor-not-allowed" 
          : isJoined
          ? "bg-white border-2 border-black text-black hover:bg-danger-500 hover:text-white"
          : "neo-btn neo-btn-primary hover:-translate-y-1"
      }`}
    >
      {isProcessing ? "처리 중..." : label}
    </button>
  );
}
