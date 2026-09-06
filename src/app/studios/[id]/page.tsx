"use client";

import { useState, use, useEffect, useRef } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: studio, error, mutate } = useSWR(`/api/studios/${id}`, fetcher);
  
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mapElement = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [isEditingStudio, setIsEditingStudio] = useState(false);
  const [editStudioData, setEditStudioData] = useState({ name: "", address: "", description: "" });
  const [savingStudio, setSavingStudio] = useState(false);

  // Review Edit State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewContent, setEditReviewContent] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (studio) {
      setEditStudioData({
        name: studio.name || "",
        address: studio.address || "",
        description: studio.description || "",
      });
    }
  }, [studio]);
  
  useEffect(() => {
    if (!studio || !mapElement.current || !window.naver) return;
    const location = new window.naver.maps.LatLng(studio.latitude, studio.longitude);
    const mapOptions = {
      center: location,
      zoom: 16,
    };
    const map = new window.naver.maps.Map(mapElement.current, mapOptions);
    new window.naver.maps.Marker({
      position: location,
      map,
    });
  }, [studio]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/studios/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content, images: [] }),
      });
      if (res.ok) {
        setContent("");
        setRating(5);
        mutate();
      } else {
        alert("후기 등록 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudio(true);
    try {
      const res = await fetch(`/api/studios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStudioData),
      });
      if (res.ok) {
        setIsEditingStudio(false);
        mutate();
      } else {
        alert("수정 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSavingStudio(false);
    }
  };

  const handleDeleteStudio = async () => {
    if (!confirm("정말 이 합주실을 삭제하시겠습니까? 관련 후기도 모두 삭제됩니다.")) return;
    try {
      const res = await fetch(`/api/studios/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/studios");
      } else {
        alert("삭제 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/studios/${id}/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      } else {
        alert("후기 삭제 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleUpdateReview = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!editReviewContent.trim()) return;
    setSavingReview(true);
    try {
      const res = await fetch(`/api/studios/${id}/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editReviewRating, content: editReviewContent }),
      });
      if (res.ok) {
        setEditingReviewId(null);
        mutate();
      } else {
        alert("후기 수정 실패");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setSavingReview(false);
    }
  };

  if (error) return <div className="text-center py-20 font-bold text-red-500">합주실을 찾을 수 없습니다.</div>;
  if (!studio) return <div className="text-center py-20 font-bold">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="mb-4">
        <Link href="/studios" className="text-sm font-bold border-2 border-black px-3 py-1 hover:bg-neo-yellow">← 지도 보기</Link>
      </div>

      <div className="neo-card p-6 mb-8 relative">
        {(session?.user?.role === "ADMIN" || session?.user?.id === studio.creatorId) && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button onClick={() => setIsEditingStudio(true)} className="bg-neo-yellow text-black font-bold px-3 py-1 text-xs border-2 border-black hover:bg-yellow-400">수정</button>
            <button onClick={handleDeleteStudio} className="bg-red-500 text-white font-bold px-3 py-1 text-xs border-2 border-black hover:bg-red-700">삭제</button>
          </div>
        )}
        <h1 className="text-3xl font-black mb-2 pr-24">{studio.name}</h1>
        <p className="text-gray-700 font-bold mb-4">📍 {studio.address}</p>
        {studio.description && (
          <div className="p-4 bg-gray-100 border-2 border-black text-sm whitespace-pre-wrap mb-4">
            {studio.description}
          </div>
        )}
        <div ref={mapElement} className="w-full h-[300px] border-2 border-black"></div>
      </div>

      <div className="neo-card p-6">
        <h2 className="text-2xl font-black mb-6">방문 후기 ({studio.reviews?.length || 0})</h2>

        {/* Review Form */}
        {session?.user ? (
          <form onSubmit={handleSubmitReview} className="mb-8 border-2 border-black p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold">별점:</span>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border-2 border-black p-1 font-bold outline-none">
                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                <option value={4}>⭐⭐⭐⭐ (4)</option>
                <option value={3}>⭐⭐⭐ (3)</option>
                <option value={2}>⭐⭐ (2)</option>
                <option value={1}>⭐ (1)</option>
              </select>
            </div>
            <RichTextEditor 
              value={content} 
              onChange={setContent} 
              placeholder="이 합주실에 대한 후기와 사진을 남겨주세요!" 
            />
            <div className="flex justify-end mt-2">
              <button disabled={submitting} type="submit" className="neo-btn neo-btn-primary px-6 py-2 font-bold">
                {submitting ? "등록 중..." : "후기 등록"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-100 border-2 border-black text-center font-bold">
            후기를 작성하려면 로그인해주세요.
          </div>
        )}

        {/* Review List */}
        <div className="space-y-4">
          {studio.reviews?.length > 0 ? (
            studio.reviews.map((review: any) => (
              <div key={review.id} className="border-b-2 border-black pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  {review.user.image ? (
                    <Image src={review.user.image} alt={review.user.name} width={32} height={32} className="rounded-full border-2 border-black" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-neo-pink flex items-center justify-center text-white font-bold">
                      {review.user.name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold">{review.user.name}</div>
                    <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="ml-auto text-lg flex items-center gap-2">
                    {"⭐".repeat(review.rating)}
                    {(session?.user?.id === review.userId || session?.user?.role === "ADMIN") && editingReviewId !== review.id && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => {
                          setEditingReviewId(review.id);
                          setEditReviewContent(review.content);
                          setEditReviewRating(review.rating);
                        }} className="text-xs bg-gray-200 hover:bg-gray-300 border-2 border-black px-2 py-1 font-bold">수정</button>
                        <button onClick={() => handleDeleteReview(review.id)} className="text-xs bg-red-500 text-white hover:bg-red-600 border-2 border-black px-2 py-1 font-bold">삭제</button>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingReviewId === review.id ? (
                  <form onSubmit={(e) => handleUpdateReview(e, review.id)} className="pl-11 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm">별점 수정:</span>
                      <select value={editReviewRating} onChange={(e) => setEditReviewRating(Number(e.target.value))} className="border-2 border-black p-1 text-sm font-bold outline-none">
                        <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4)</option>
                        <option value={3}>⭐⭐⭐ (3)</option>
                        <option value={2}>⭐⭐ (2)</option>
                        <option value={1}>⭐ (1)</option>
                      </select>
                    </div>
                    <RichTextEditor 
                      value={editReviewContent} 
                      onChange={setEditReviewContent} 
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={() => setEditingReviewId(null)} className="neo-btn px-4 py-1 font-bold text-sm bg-gray-200">취소</button>
                      <button type="submit" disabled={savingReview} className="neo-btn neo-btn-primary px-4 py-1 font-bold text-sm">{savingReview ? "저장 중..." : "저장"}</button>
                    </div>
                  </form>
                ) : (
                  <div 
                    className="pl-11 prose prose-sm sm:prose-base max-w-none break-words" 
                    dangerouslySetInnerHTML={{ __html: review.content }} 
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-center font-bold text-gray-500 py-8">아직 등록된 후기가 없습니다. 첫 후기를 남겨주세요!</p>
          )}
        </div>
      </div>

      {isEditingStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-3 border-black border border-2 border-black rounded-none w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b-2 border-black bg-neo-yellow flex justify-between items-center">
              <h2 className="text-xl font-bold text-black font-black">합주실 수정</h2>
              <button onClick={() => setIsEditingStudio(false)} className="text-black font-black text-xl hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleEditStudio} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">합주실 이름 *</label>
                <input required type="text" value={editStudioData.name} onChange={e => setEditStudioData({...editStudioData, name: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">주소 *</label>
                <input required type="text" value={editStudioData.address} onChange={e => setEditStudioData({...editStudioData, address: e.target.value})} className="w-full border-2 border-black p-2 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">소개</label>
                <textarea value={editStudioData.description} onChange={e => setEditStudioData({...editStudioData, description: e.target.value})} className="w-full border-2 border-black p-2 font-bold" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEditingStudio(false)} className="flex-1 py-2 border-2 border-black font-bold hover:bg-gray-100">취소</button>
                <button type="submit" disabled={savingStudio} className="flex-1 py-2 border-2 border-black font-bold bg-neo-pink text-white hover:bg-pink-600">{savingStudio ? "저장 중..." : "저장"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
