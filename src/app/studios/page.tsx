"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";

interface Studio {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudiosPage() {
  const { data: session } = useSession();
  const { data: studios, error, mutate } = useSWR<Studio[]>("/api/studios", fetcher);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleAddStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", address: "", description: "" });
        mutate();
      } else {
        const err = await res.json();
        alert(err.error || "합주실 추가 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudio = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("정말 이 합주실을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/studios/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      } else {
        alert("삭제 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black font-black flex items-center gap-3">
          <span className="text-4xl">🎸</span> 합주실 리스트
        </h1>
        {session?.user && (
          <button
            onClick={() => setShowAddModal(true)}
            className="neo-btn neo-btn-primary px-4 py-2 font-bold text-sm"
          >
            + 합주실 등록
          </button>
        )}
      </div>

      {error && <p className="text-red-500 font-bold mb-4">합주실 목록을 불러오지 못했습니다.</p>}
      {!studios && !error && <p className="font-bold mb-4">로딩 중...</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios?.map(studio => (
          <Link href={`/studios/${studio.id}`} key={studio.id} className="block group">
            <div className="neo-card p-6 h-full bg-white flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-none transition-all cursor-pointer relative">
              {(session?.user?.role === "ADMIN" || session?.user?.id === (studio as any).creatorId) && (
                <button 
                  onClick={(e) => handleDeleteStudio(e, studio.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white font-bold px-2 py-1 text-xs border-2 border-black hover:bg-red-700 z-10"
                >
                  삭제
                </button>
              )}
              <div>
                <h3 className="font-black text-2xl group-hover:text-neo-pink mb-2 line-clamp-1 pr-10">{studio.name}</h3>
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-start gap-1">
                  <span>📍</span>
                  <span className="line-clamp-2">{studio.address}</span>
                </p>
                {studio.description && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{studio.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-neo-pink">후기/지도 보기 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-3 border-black border border-2 border-black rounded-none w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b-2 border-black bg-neo-yellow flex justify-between items-center">
              <h2 className="text-xl font-bold text-black font-black">합주실 등록</h2>
              <button onClick={() => setShowAddModal(false)} className="text-black font-black text-xl hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleAddStudio} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">합주실 이름 *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">주소 *</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">소개</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-black p-2 font-bold" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border-2 border-black font-bold hover:bg-gray-100">취소</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 border-2 border-black font-bold bg-neo-pink text-white hover:bg-pink-600">{submitting ? "등록 중..." : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
