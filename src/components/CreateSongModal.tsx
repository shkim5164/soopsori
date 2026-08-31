"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { POSITIONS, getPositionBadgeClass, getPositionEmoji, getPositionLabel } from "@/lib/constants";

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
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const fetchYoutubeMeta = async (url: string) => {
    if (!url || !url.includes("youtu")) return;
    if (newSong.title && newSong.artist) return; // 이미 입력되어 있으면 덮어쓰지 않음
    
    setIsFetchingMeta(true);
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        let fetchedTitle = data.title || "";
        let fetchedArtist = data.artist ? data.artist.replace(/ - Topic$/i, "") : "";
        
        // "아티스트 - 제목" 형식인 경우 분리 시도
        if (fetchedTitle.includes(" - ")) {
          const parts = fetchedTitle.split(" - ");
          if (parts.length >= 2 && !fetchedArtist) {
            fetchedArtist = parts[0].trim();
            fetchedTitle = parts.slice(1).join(" - ").trim();
          }
        }

        setNewSong(prev => ({
          ...prev,
          title: prev.title || fetchedTitle,
          artist: prev.artist || fetchedArtist
        }));
      }
    } catch (error) {
      console.error("Failed to fetch youtube meta", error);
    } finally {
      setIsFetchingMeta(false);
    }
  };

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

  const [customSession, setCustomSession] = useState("");

  const addSession = (position: string) => {
    setNewSong((prev) => ({ ...prev, sessions: [...prev.sessions, position] }));
  };

  const removeSession = (index: number) => {
    setNewSong((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 곡 등록" size="lg">
      <form onSubmit={handleCreateSong} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-300">
              YouTube URL
            </label>
            {isFetchingMeta && <span className="text-xs text-emerald-400 animate-pulse">정보 불러오는 중...</span>}
          </div>
          <input
            type="url"
            value={newSong.youtubeUrl}
            onChange={(e) => {
              setNewSong({ ...newSong, youtubeUrl: e.target.value });
            }}
            onBlur={(e) => fetchYoutubeMeta(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="https://www.youtube.com/watch?v=... (입력 시 자동 정보 추출)"
          />
        </div>

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
          
          <div className="flex flex-wrap gap-2 mb-3">
            {newSong.sessions.map((pos, index) => (
              <div key={index} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${getPositionBadgeClass(pos)}`}>
                <span className="text-sm">
                  {getPositionEmoji(pos)} {getPositionLabel(pos)}
                </span>
                <button type="button" onClick={() => removeSession(index)} className="opacity-70 hover:opacity-100 ml-1 transition-opacity">
                  ×
                </button>
              </div>
            ))}
            {newSong.sessions.length === 0 && <span className="text-neutral-500 text-sm py-1.5">선택된 세션이 없습니다</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            {POSITIONS.filter(p => p.id !== "other").map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => addSession(pos.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-forest-900/20 text-neutral-400 hover:text-neutral-200 border border-forest-700/20 hover:border-forest-700/40 transition-colors"
              >
                + {pos.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text" 
              value={customSession} 
              onChange={e => setCustomSession(e.target.value)}
              placeholder="직접 입력 (예: 플루트)" 
              className="flex-1 max-w-[200px] px-3 py-1.5 rounded-lg bg-forest-900/20 border border-forest-700/30 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.nativeEvent.isComposing) return;
                  if (customSession.trim()) {
                    addSession(customSession.trim());
                    setCustomSession("");
                  }
                }
              }}
            />
            <button 
              type="button"
              onClick={() => {
                if (customSession.trim()) {
                  addSession(customSession.trim());
                  setCustomSession("");
                }
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              추가
            </button>
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
