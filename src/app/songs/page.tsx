"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import { POSITIONS, getPositionLabel, getPositionBadgeClass, getYouTubeThumbnail } from "@/lib/constants";
import Link from "next/link";

interface SongSession {
  id: string;
  position: string;
  status: string;
  user: { id: string; name: string; image: string } | null;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string | null;
  createdAt: string;
  difficulty: number;
  user: { id: string; name: string; image: string };
  sessions: SongSession[];
  _count: { likes: number };
  likes: { userId: string }[] | false;
}

export default function SongsPage() {
  const { data: session } = useSession();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    youtubeUrl: "",
    description: "",
    difficulty: 3,
    sessions: [] as string[],
  });

  const fetchSongs = useCallback(async () => {
    try {
      const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
      const sortParam = `sort=${sort}`;
      const diffParam = difficultyFilter ? `difficulty=${difficultyFilter}` : "";
      const params = [searchParam, sortParam, diffParam].filter(Boolean).join("&");
      const res = await fetch(`/api/songs?${params}`);
      const data = await res.json();
      setSongs(data);
    } catch (error) {
      console.error("Failed to fetch songs:", error);
    } finally {
      setLoading(false);
    }
  }, [search, sort, difficultyFilter]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSong),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewSong({ title: "", artist: "", youtubeUrl: "", description: "", difficulty: 3, sessions: [] });
        fetchSongs();
      }
    } catch (error) {
      console.error("Failed to create song:", error);
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

  const handleJoinSession = async (songId: string, sessionId: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) fetchSongs();
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  const handleLeaveSession = async (songId: string, sessionId: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchSongs();
    } catch (error) {
      console.error("Failed to leave session:", error);
    }
  };

  const handleToggleLike = async (songId: string, currentLiked: boolean) => {
    if (!session) {
      alert("로그인이 필요합니다.");
      return;
    }
    // 낙관적 업데이트
    setSongs(prevSongs => prevSongs.map(song => {
      if (song.id === songId) {
        return {
          ...song,
          likes: currentLiked ? [] : [{ userId: session.user.id }], // 임시 배열
          _count: {
            ...song._count,
            likes: song._count.likes + (currentLiked ? -1 : 1)
          }
        };
      }
      return song;
    }));

    try {
      const res = await fetch(`/api/songs/${songId}/like`, { method: "POST" });
      if (!res.ok) {
        // 실패 시 복구
        fetchSongs();
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      fetchSongs();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">🎵 곡 목록</h1>
          <p className="text-neutral-500 mt-1">하고 싶은 곡을 등록하고 세션에 참여하세요</p>
        </div>
        {session && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
          >
            + 곡 등록하기
          </button>
        )}
      </div>

      {/* Search and Sort */}
      <div className="mb-6 animate-fade-in-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: "0.1s" }}>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="곡 제목 또는 아티스트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-forest-900/30 border border-forest-700/30 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          <svg className="absolute left-3 top-3.5 w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-start">
          <select
            value={difficultyFilter || ""}
            onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 rounded-lg bg-forest-900/30 border border-forest-700/30 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">모든 난이도</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>
          
          <div className="flex bg-forest-900/30 rounded-xl p-1 border border-forest-700/30">
            <button
              onClick={() => setSort("latest")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "latest" ? "bg-forest-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "popular" ? "bg-forest-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              인기순
            </button>
          </div>
        </div>
      </div>

      {/* Songs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static p-4">
              <div className="skeleton h-36 mb-3" />
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {songs.map((song) => {
            const thumbnail = song.youtubeUrl ? getYouTubeThumbnail(song.youtubeUrl) : null;
            const openSessions = song.sessions.filter((s) => s.status === "OPEN");
            const filledSessions = song.sessions.filter((s) => s.status === "FILLED");
            const isLiked = Array.isArray(song.likes) && song.likes.length > 0;

            return (
              <div key={song.id} className="glass-card overflow-hidden group">
                {/* Thumbnail */}
                <Link href={`/songs/${song.id}`}>
                  {thumbnail ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-neutral-300">
                        ▶ YouTube
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-forest-900/50 flex items-center justify-center">
                      <span className="text-4xl opacity-30">🎵</span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  {/* Song Info */}
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/songs/${song.id}`} className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-100 truncate hover:text-emerald-400 transition-colors">
                        {song.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-neutral-500">{song.artist}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          {"⭐".repeat(song.difficulty)}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleToggleLike(song.id, isLiked)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        isLiked ? "text-danger-500" : "text-neutral-500 hover:text-danger-400"
                      }`}
                    >
                      <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{song._count?.likes || 0}</span>
                    </button>
                  </div>

                  {/* Sessions */}
                  {song.sessions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {song.sessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(s.position)}`}
                          >
                            {getPositionLabel(s.position)}
                          </span>
                          {s.status === "FILLED" && s.user ? (
                            <div className="flex items-center gap-1.5">
                              {s.user.image && (
                                <img src={s.user.image} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              <span className="text-xs text-neutral-400">{s.user.name}</span>
                              {session?.user?.id === s.user.id && (
                                <button
                                  onClick={() => handleLeaveSession(song.id, s.id)}
                                  className="text-xs text-danger-400 hover:text-danger-500 ml-1"
                                >
                                  취소
                                </button>
                              )}
                            </div>
                          ) : (
                            session?.user?.id && (
                              <button
                                onClick={() => handleJoinSession(song.id, s.id)}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                              >
                                참여
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-forest-700/20">
                    <div className="flex items-center gap-1.5">
                      {song.user.image && (
                        <img src={song.user.image} alt="" className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-xs text-neutral-500">{song.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {openSessions.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                          {openSessions.length}자리 남음
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-card-static">
          <span className="text-5xl mb-4 block">🎸</span>
          <p className="text-neutral-400 text-lg">등록된 곡이 없습니다</p>
          <p className="text-neutral-600 text-sm mt-1">
            첫 번째 곡을 등록해보세요!
          </p>
        </div>
      )}

      {/* Create Song Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="곡 등록" size="lg">
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
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900/40 text-neutral-400 hover:text-neutral-200 hover:bg-forest-900/60 transition-colors font-medium text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              등록하기
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
