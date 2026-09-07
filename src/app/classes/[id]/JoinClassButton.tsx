"use client";

import { useState } from "react";
import { joinClass } from "../actions";
import { useRouter } from "next/navigation";

export default function JoinClassButton({ classId, disabled, label }: { classId: string, disabled: boolean, label: string }) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (disabled) return;
    
    setIsJoining(true);
    try {
      await joinClass(classId);
      alert("클래스 참가 신청이 완료되었습니다!");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "참가 신청 중 오류가 발생했습니다.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <button
      onClick={handleJoin}
      disabled={disabled || isJoining}
      className={`w-full py-4 text-lg font-black transition-all ${
        disabled 
          ? "bg-gray-300 border-2 border-black text-gray-500 cursor-not-allowed" 
          : "neo-btn neo-btn-primary hover:-translate-y-1"
      }`}
    >
      {isJoining ? "처리 중..." : label}
    </button>
  );
}
