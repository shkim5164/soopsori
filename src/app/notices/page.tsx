"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import { formatDate, timeAgo } from "@/lib/constants";

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; image: string };
}

export default function NoticesPage() {
  const { data: session } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", pinned: false });

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices");
      if (res.ok) setNotices(await res.json());
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewNotice({ title: "", content: "", pinned: false });
        fetchNotices();
      }
    } catch (error) {
      console.error("Failed to create notice:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">📢 공지사항</h1>
          <p className="text-neutral-500 mt-1">동호회 소식과 안내사항을 확인하세요</p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
          >
            + 공지 작성
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card-static p-5">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : notices.length > 0 ? (
        <div className="space-y-3 stagger-children">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`glass-card p-5 cursor-pointer ${
                notice.pinned ? "ring-1 ring-gold-500/20" : ""
              }`}
              onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
            >
              <div className="flex items-start gap-3">
                {notice.pinned && (
                  <span className="text-gold-400 text-sm mt-0.5">📌</span>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-100">{notice.title}</h3>
                    {notice.pinned && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400">
                        고정
                      </span>
                    )}
                  </div>

                  {expandedId === notice.id ? (
                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap mt-2">
                      {notice.content}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500 line-clamp-2">{notice.content}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-xs text-neutral-600">
                    {notice.author.image && (
                      <img src={notice.author.image} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    <span>{notice.author.name}</span>
                    <span>·</span>
                    <span>{timeAgo(notice.createdAt)}</span>
                  </div>
                </div>

                <svg
                  className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${
                    expandedId === notice.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card-static">
          <span className="text-5xl mb-4 block">📢</span>
          <p className="text-neutral-400 text-lg">공지사항이 없습니다</p>
        </div>
      )}

      {/* Create Notice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="공지 작성" size="lg">
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">제목 *</label>
            <input
              type="text"
              required
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="공지 제목"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">내용 *</label>
            <textarea
              required
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              placeholder="공지 내용을 입력하세요"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newNotice.pinned}
              onChange={(e) => setNewNotice({ ...newNotice, pinned: e.target.checked })}
              className="w-4 h-4 rounded border-forest-700 text-emerald-500 focus:ring-emerald-500/20 bg-forest-900/40"
            />
            <span className="text-sm text-neutral-400">📌 상단 고정</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900/40 text-neutral-400 hover:text-neutral-200 transition-colors font-medium text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 text-white font-medium text-sm transition-all"
            >
              등록하기
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
