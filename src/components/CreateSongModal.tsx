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
            <label className="block text-sm font-medium text-black font-bold">
              YouTube URL
            </label>
            {isFetchingMeta && <span className="text-xs text-neo-pink font-black animate-pulse">정보 불러오는 중...</span>}
          </div>
          <input
            type="url"
            value={newSong.youtubeUrl}
            onChange={(e) => {
              setNewSong({ ...newSong, youtubeUrl: e.target.value });
            }}
            onBlur={(e) => fetchYoutubeMeta(e.target.value)}
            className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
            placeholder="https://www.youtube.com/watch?v=... (입력 시 자동 정보 추출)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black font-bold mb-1.5">
            곡 제목 *
          </label>
          <input
            type="text"
            required
            value={newSong.title}
            onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
            placeholder="곡 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black font-bold mb-1.5">
            아티스트 *
          </label>
          <input
            type="text"
            required
            value={newSong.artist}
            onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
            className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
            placeholder="아티스트명을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black font-bold mb-1.5">
            설명
          </label>
          <textarea
            value={newSong.description}
            onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors resize-none"
            placeholder="곡에 대한 설명이나 메모를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black font-bold mb-2">
            필요한 세션
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {newSong.sessions.map((pos, index) => (
              <div key={index} className={`flex items-center gap-1 px-3 py-1.5 rounded-none ${getPositionBadgeClass(pos)}`}>
                <span className="text-sm">
                  {getPositionEmoji(pos)} {getPositionLabel(pos)}
                </span>
                <button type="button" onClick={() => removeSession(index)} className="opacity-70 hover:opacity-100 ml-1 transition-opacity">
                  ×
                </button>
              </div>
            ))}
            {newSong.sessions.length === 0 && <span className="text-gray-800 font-bold text-sm py-1.5">선택된 세션이 없습니다</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            {POSITIONS.filter(p => p.id !== "other").map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => addSession(pos.id)}
                className="px-3 py-1.5 rounded-none text-sm font-medium bg-white border-3 border-black neo-shadow text-black font-bold hover:text-black font-black border border-2 border-black hover:border-2 border-black transition-colors"
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
              className="flex-1 max-w-[200px] px-3 py-1.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-sm text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
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
              className="px-3 py-1.5 rounded-none text-sm font-medium neo-btn neo-btn-primary/15 text-neo-pink font-black hover:neo-btn neo-btn-primary/25 transition-colors"
            >
              추가
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black font-bold mb-2">
            난이도
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewSong({ ...newSong, difficulty: star })}
                className={`text-2xl transition-colors ${
                  star <= newSong.difficulty ? "text-black font-black bg-neo-yellow px-1" : "text-gray-900"
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
            className="flex-1 px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow text-black font-bold hover:text-black font-black hover:bg-white border-3 border-black neo-shadow transition-colors font-medium text-sm disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200 hover:neo-shadow-lg hover:neo-shadow disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
