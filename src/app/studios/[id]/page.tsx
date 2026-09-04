"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: studio, error, mutate } = useSWR(`/api/studios/${id}`, fetcher);
  
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  if (error) return <div className="text-center py-20 font-bold text-red-500">합주실을 찾을 수 없습니다.</div>;
  if (!studio) return <div className="text-center py-20 font-bold">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="mb-4">
        <Link href="/studios" className="text-sm font-bold border-2 border-black px-3 py-1 hover:bg-neo-yellow">← 지도 보기</Link>
      </div>

      <div className="neo-card p-6 mb-8">
        <h1 className="text-3xl font-black mb-2">{studio.name}</h1>
        <p className="text-gray-700 font-bold mb-4">📍 {studio.address}</p>
        {studio.description && (
          <div className="p-4 bg-gray-100 border-2 border-black text-sm whitespace-pre-wrap">
            {studio.description}
          </div>
        )}
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
            <textarea
              className="w-full border-2 border-black p-3 font-bold mb-3 outline-none"
              rows={3}
              placeholder="이 합주실에 대한 후기를 남겨주세요!"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <div className="flex justify-end">
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
                  <div className="ml-auto text-lg">{"⭐".repeat(review.rating)}</div>
                </div>
                <p className="whitespace-pre-wrap pl-11">{review.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center font-bold text-gray-500 py-8">아직 등록된 후기가 없습니다. 첫 후기를 남겨주세요!</p>
          )}
        </div>
      </div>
    </div>
  );
}
