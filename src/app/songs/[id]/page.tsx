"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { getPositionLabel, getPositionBadgeClass, getPositionEmoji, formatDate } from "@/lib/constants";
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
  description: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string; position: string | null };
  sessions: SongSession[];
}

export default function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSong = async () => {
    try {
      const res = await fetch(`/api/songs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSong(data);
      }
    } catch (error) {
      console.error("Failed to fetch song:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSong();
  }, [id]);

  const handleJoinSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/songs/${id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) fetchSong();
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  const handleLeaveSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/songs/${id}/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchSong();
    } catch (error) {
      console.error("Failed to leave session:", error);
    }
  };

  const handleDeleteSong = async () => {
    if (!confirm("정말 이 곡을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/songs";
      }
    } catch (error) {
      console.error("Failed to delete song:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton aspect-video mb-6 rounded-xl" />
        <div className="skeleton h-6 w-full mb-3" />
        <div className="skeleton h-6 w-2/3" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <span className="text-5xl block mb-4">😢</span>
        <h1 className="text-xl font-bold text-neutral-300">곡을 찾을 수 없습니다</h1>
        <Link href="/songs" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
          ← 곡 목록으로
        </Link>
      </div>
    );
  }

  const openSessions = song.sessions.filter((s) => s.status === "OPEN");
  const filledSessions = song.sessions.filter((s) => s.status === "FILLED");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 animate-fade-in-up">
        <Link href="/songs" className="text-sm text-neutral-500 hover:text-emerald-400 transition-colors">
          ← 곡 목록
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
          {/* YouTube Player */}
          {song.youtubeUrl && (
            <YouTubeEmbed url={song.youtubeUrl} title={song.title} />
          )}

          {/* Song Info */}
          <div className="glass-card-static p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">{song.title}</h1>
                <p className="text-lg text-neutral-400 mt-1">{song.artist}</p>
              </div>
              {(session?.user?.id === song.user.id || session?.user?.role === "ADMIN") && (
                <button
                  onClick={handleDeleteSong}
                  className="p-2 rounded-lg text-neutral-600 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                  title="곡 삭제"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {song.description && (
              <p className="mt-4 text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
                {song.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-forest-700/20">
              {song.user.image && (
                <img src={song.user.image} alt="" className="w-8 h-8 rounded-full border border-forest-700" />
              )}
              <div>
                <p className="text-sm text-neutral-300">{song.user.name}</p>
                <p className="text-xs text-neutral-600">{formatDate(song.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Panel */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="glass-card-static p-6">
            <h2 className="text-lg font-bold text-neutral-100 mb-4">🎸 세션 현황</h2>

            {song.sessions.length > 0 ? (
              <div className="space-y-3">
                {song.sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      s.status === "FILLED"
                        ? "bg-forest-900/20 border-forest-700/20"
                        : "bg-emerald-500/5 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${getPositionBadgeClass(s.position)}`}>
                        {getPositionEmoji(s.position)} {getPositionLabel(s.position)}
                      </span>
                      <span className={`text-xs ${s.status === "OPEN" ? "text-emerald-400" : "text-neutral-500"}`}>
                        {s.status === "OPEN" ? "모집 중" : "완료"}
                      </span>
                    </div>

                    {s.status === "FILLED" && s.user ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {s.user.image && (
                            <img src={s.user.image} alt="" className="w-6 h-6 rounded-full" />
                          )}
                          <span className="text-sm text-neutral-300">{s.user.name}</span>
                        </div>
                        {session?.user?.id === s.user.id && (
                          <button
                            onClick={() => handleLeaveSession(s.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-colors"
                          >
                            참여 취소
                          </button>
                        )}
                      </div>
                    ) : (
                      session?.user?.id && (
                        <button
                          onClick={() => handleJoinSession(s.id)}
                          className="w-full py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition-colors"
                        >
                          참여하기
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm text-center py-4">
                등록된 세션이 없습니다
              </p>
            )}

            {/* Summary */}
            {song.sessions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-forest-700/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">충원</span>
                  <span className="text-neutral-300">
                    {filledSessions.length} / {song.sessions.length}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-forest-900/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-forest-400 transition-all duration-500"
                    style={{
                      width: `${(filledSessions.length / song.sessions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
