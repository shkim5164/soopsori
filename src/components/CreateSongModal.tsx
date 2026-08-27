"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { POSITIONS, getPositionBadgeClass } from "@/lib/constants";

interface CreateSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (songId: string) => void;
}

export default function CreateSongModal({ isOpen, onClose, onSuccess }: CreateSongModalProps) {
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    youtubeUrl: "",
    description: "",
    difficulty: 3,
    sessions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSong),
      });
      if (res.ok) {
        const data = await res.json();
        setNewSong({ title: "", artist: "", youtubeUrl: "", description: "", difficulty: 3, sessions: [] });
        onSuccess(data.id);
      } else {
        const err = await res.json();
        alert(err.error || "곡 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create song:", error);
      alert("곡 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionPosition = (position: string) => {
    setNewSong((prev) => ({
      ...prev,
      sessions: prev.sessions.includes(position)
        ? prev.sessions.filter((s) => s !== position)
        : [...prev.sessions, position],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 곡 등록" size="lg">
      <form onSubmit={handleCreateSong} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            곡 제목 *
          </label>
          <input
            type="text"
            required
            value={newSong.title}
            onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="곡 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            아티스트 *
          </label>
          <input
            type="text"
            required
            value={newSong.artist}
            onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="아티스트명을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            YouTube URL
          </label>
          <input
            type="url"
            value={newSong.youtubeUrl}
            onChange={(e) => setNewSong({ ...newSong, youtubeUrl: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            설명
          </label>
          <textarea
            value={newSong.description}
            onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
            placeholder="곡에 대한 설명이나 메모를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            필요한 세션
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => toggleSessionPosition(pos.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  newSong.sessions.includes(pos.id)
                    ? `${getPositionBadgeClass(pos.id)} ring-1 ring-current`
                    : "bg-forest-900/30 text-neutral-500 hover:text-neutral-400 border border-forest-700/20"
                }`}
              >
                {pos.emoji} {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            난이도
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewSong({ ...newSong, difficulty: star })}
                className={`text-2xl transition-colors ${
                  star <= newSong.difficulty ? "text-gold-400" : "text-neutral-700"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900/40 text-neutral-400 hover:text-neutral-200 hover:bg-forest-900/60 transition-colors font-medium text-sm disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
