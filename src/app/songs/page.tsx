"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import CreateSongModal from "@/components/CreateSongModal";
import { POSITIONS, getPositionLabel, getPositionBadgeClass, getYouTubeThumbnail } from "@/lib/constants";
import Link from "next/link";

interface SongSession {
  id: string;
  position: string;
  description: string | null;
  status: string;
  user: { id: string; name: string; image: string } | null;
}

interface Song {
  band: { id: string; name: string } | null;
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string | null;
  createdAt: string;
  difficulty: number;
  user: { id: string; name: string; image: string };
  sessions: SongSession[];
  _count: { likes: number, comments: number };
  likes: { userId: string }[] | false;
}

async function fetchList(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("목록을 불러오지 못했습니다");
  return response.json();
}

export default function SongsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [sort, setSort] = useState<"latest" | "popular" | "comments">("latest");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const query = new URLSearchParams({ sort });
  if (debouncedSearch) query.set("search", debouncedSearch);
  if (difficultyFilter) query.set("difficulty", String(difficultyFilter));
  if (positionFilter) query.set("position", positionFilter);
  if (bandFilter) query.set("bandId", bandFilter);
  // 검색 조건별 캐시를 사용하여 이전 요청의 늦은 응답이 현재 결과를 덮어쓰지 않게 합니다.
  const { data: songs = [], error, isLoading: loading, mutate: mutateSongs } = useSWR<Song[]>([`/api/songs?${query}`, session?.user?.id ?? null], ([url]: [string, string | null]) => fetchList(url));
  const { data: bands = [], error: bandsError, isLoading: bandsLoading, mutate: reloadBands } = useSWR<{ id: string; name: string }[]>("/api/bands", fetchList);
  const fetchSongs = () => mutateSongs();
  const hasFilters = !!(search.trim() || bandFilter || positionFilter || difficultyFilter);
  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setBandFilter("");
    setPositionFilter("");
    setDifficultyFilter(null);
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/members").then(res => res.ok && res.json()).then(data => setAllMembers(data || [])).catch(() => setAllMembers([]));
    }
  }, [session?.user?.role]);

  const handleJoinSession = async (songId: string, sessionId: string, targetUserId?: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId: targetUserId }),
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
    mutateSongs(prevSongs => (prevSongs || []).map(song => {
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
    }), { revalidate: false });

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
          <h1 className="text-3xl font-bold text-black font-black">🎵 곡 목록</h1>
          <p className="text-gray-800 font-bold mt-1">하고 싶은 곡을 등록하고 세션에 참여하세요</p>
        </div>
        {session && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200 hover:neo-shadow-lg hover:neo-shadow hover:-translate-y-0.5"
          >
            + 곡 등록하기
          </button>
        )}
      </div>

      {/* Search and Sort */}
      <div className="mb-6 animate-fade-in-up flex flex-wrap gap-3" style={{ animationDelay: "0.1s" }}>
        <div className="relative w-full sm:min-w-72 sm:flex-1">
          <input
            type="text"
            aria-label="곡 제목, 아티스트, 밴드 이름 검색"
            placeholder="곡 제목 · 아티스트 · 밴드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black focus:ring-1 focus:bg-neo-yellow focus:ring-0 transition-all"
          />
          <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="밴드 필터"
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            className="max-w-full px-4 py-2 bg-white border-3 border-black neo-shadow text-sm text-black font-black"
          >
            <option value="">모든 곡</option>
            <option value="none">일반 합주곡</option>
            <option value="any">밴드곡 전체</option>
            <optgroup label="밴드별">
              {bands.map(band => <option key={band.id} value={band.id}>{band.name}</option>)}
            </optgroup>
          </select>
          <select
            aria-label="포지션 필터"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-sm text-black font-black focus:outline-none focus:border-3 border-black"
          >
            <option value="">모든 포지션</option>
            {POSITIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.emoji} {pos.label}
              </option>
            ))}
          </select>

          <select
            aria-label="난이도 필터"
            value={difficultyFilter || ""}
            onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-sm text-black font-black focus:outline-none focus:border-3 border-black"
          >
            <option value="">모든 난이도</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>
          
          <div className="flex bg-white border-3 border-black neo-shadow rounded-none p-1 border border-2 border-black">
            <button
              onClick={() => setSort("latest")}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
                sort === "latest" ? "bg-neo-yellow border-2 border-black text-black text-black font-black" : "text-black font-bold hover:text-black font-black"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
                sort === "popular" ? "bg-neo-yellow border-2 border-black text-black text-black font-black" : "text-black font-bold hover:text-black font-black"
              }`}
            >
              인기순
            </button>
            <button
              onClick={() => setSort("comments")}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
                sort === "comments" ? "bg-neo-yellow border-2 border-black text-black text-black font-black" : "text-black font-bold hover:text-black font-black"
              }`}
            >
              댓글순
            </button>
          </div>
        </div>
      </div>

      {bandsLoading && <p className="text-sm mb-4">밴드 목록을 불러오는 중…</p>}
      {bandsError && <p role="alert" className="text-sm mb-4">밴드 목록을 불러오지 못했습니다. <button className="underline" onClick={() => reloadBands()}>다시 시도</button></p>}
      <div className="flex items-center gap-4 mb-4 text-sm font-bold" aria-live="polite">
        {!loading && !error && <span>{songs.length}곡</span>}
        {hasFilters && <button onClick={resetFilters} className="underline">검색·필터 초기화</button>}
      </div>

      {/* Songs Grid */}
      {error ? (
        <div className="neo-card p-8 text-center" role="alert">
          <p className="font-bold">곡 목록을 불러오지 못했습니다.</p>
          <button className="neo-btn mt-4" onClick={() => fetchSongs()}>다시 시도</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="neo-card p-4">
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
              <div key={song.id} className="neo-card overflow-hidden group">
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
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-white font-bold">
                        ▶ YouTube
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-white border-3 border-black neo-shadow flex items-center justify-center">
                      <span className="text-4xl opacity-30">🎵</span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  {/* Song Info */}
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/songs/${song.id}`} className="min-w-0 flex-1">
                      <h3 className="font-semibold text-black font-black truncate hover:text-neo-pink font-black transition-colors">
                        {song.title}
                        {song.band && <span className="block text-sm font-bold mt-2">🎸 {song.band.name}</span>}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-gray-800 font-bold">{song.artist}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/10 text-black font-black bg-neo-yellow px-1 border border-gold-500/20">
                          {"⭐".repeat(song.difficulty)}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleToggleLike(song.id, isLiked)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        isLiked ? "text-danger-500" : "text-gray-800 font-bold hover:text-danger-400"
                      }`}
                    >
                      <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{song._count?.likes || 0}</span>
                    </button>
                    <div className="flex flex-col items-center gap-1 text-gray-800 font-bold ml-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs">{song._count?.comments || 0}</span>
                    </div>
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
                            {s.description && <span className="opacity-75 ml-1">({s.description})</span>}
                          </span>
                          {s.status === "FILLED" && s.user ? (
                            <div className="flex items-center gap-1.5">
                              {s.user.image && (
                                <img src={s.user.image} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              <span className="text-xs text-black font-bold">{s.user.name}</span>
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
                              session.user.role === "ADMIN" ? (
                                <select 
                                  className="text-xs px-2 py-0.5 rounded bg-transparent focus:outline-none appearance-none font-bold text-gray-500"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleJoinSession(song.id, s.id, e.target.value === "ME" ? undefined : e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>추가 (관리자)...</option>
                                  <option value="ME">내가 참여</option>
                                  {allMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  onClick={() => handleJoinSession(song.id, s.id)}
                                  className="text-xs px-2 py-0.5 rounded neo-btn neo-btn-primary/15 text-neo-pink font-black hover:neo-btn neo-btn-primary/25 transition-colors"
                                >
                                  참여
                                </button>
                              )
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-black">
                    <div className="flex items-center gap-1.5">
                      {song.user.image && (
                        <img src={song.user.image} alt="" className="w-4 h-4 rounded-full border border-black" />
                      )}
                      <span className="text-xs text-gray-800 font-bold">곡 등록자 : {song.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {openSessions.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full neo-btn neo-btn-primary/15 text-neo-pink font-black">
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
        <div className="text-center py-16 neo-card">
          <span className="text-5xl mb-4 block">🎸</span>
          <p className="text-black font-bold text-lg">{hasFilters ? "검색 조건에 맞는 곡이 없습니다" : "등록된 곡이 없습니다"}</p>
          <p className="text-gray-800 text-sm mt-1">
            {hasFilters ? "검색어나 필터를 바꿔보세요." : "첫 번째 곡을 등록해보세요!"}
          </p>
        </div>
      )}

      {/* Create Song Modal */}
      <CreateSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchSongs();
        }}
      />
    </div>
  );
}
