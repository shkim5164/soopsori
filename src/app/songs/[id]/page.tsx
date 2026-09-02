"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { getPositionLabel, getPositionBadgeClass, getPositionEmoji, formatDate, POSITIONS } from "@/lib/constants";
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
  difficulty: number;
  user: { id: string; name: string; image: string; position: string | null };
  sessions: SongSession[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string; role: string };
}

export default function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [song, setSong] = useState<Song | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
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

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/songs/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  useEffect(() => {
    fetchSong();
    fetchComments();
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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", artist: "", youtubeUrl: "", description: "", difficulty: 3, sessions: [] as string[] });
  const [customSession, setCustomSession] = useState("");
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const fetchYoutubeMeta = async (url: string) => {
    if (!url || !url.includes("youtu")) return;
    setIsFetchingMeta(true);
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        let fetchedTitle = data.title || "";
        let fetchedArtist = data.artist ? data.artist.replace(/ - Topic$/i, "") : "";
        
        if (fetchedTitle.includes(" - ")) {
          const parts = fetchedTitle.split(" - ");
          if (parts.length >= 2 && !fetchedArtist) {
            fetchedArtist = parts[0].trim();
            fetchedTitle = parts.slice(1).join(" - ").trim();
          }
        }

        setEditForm(prev => ({
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

  const addSession = (position: string) => {
    setEditForm((prev) => ({ ...prev, sessions: [...prev.sessions, position] }));
  };

  const removeSession = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index),
    }));
  };

  const handleEditClick = () => {
    if (song) {
      setEditForm({
        title: song.title,
        artist: song.artist,
        youtubeUrl: song.youtubeUrl || "",
        description: song.description || "",
        difficulty: song.difficulty,
        sessions: song.sessions.map((s) => s.position),
      });
      setIsEditing(true);
    }
  };

  const handleUpdateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchSong();
      }
    } catch (error) {
      console.error("Failed to update song:", error);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/songs/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;
    try {
      const res = await fetch(`/api/songs/${id}/comments?commentId=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingCommentContent }),
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditingCommentContent("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/songs/${id}/comments?commentId=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton aspect-video mb-6 rounded-none" />
        <div className="skeleton h-6 w-full mb-3" />
        <div className="skeleton h-6 w-2/3" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <span className="text-5xl block mb-4">😢</span>
        <h1 className="text-xl font-bold text-black font-bold">곡을 찾을 수 없습니다</h1>
        <Link href="/songs" className="text-neo-pink font-black hover:text-neo-pink font-black text-sm mt-2 inline-block">
          ← 곡 목록으로
        </Link>
      </div>
    );
  }

  const openSessions = song.sessions.filter((s) => s.status === "OPEN");
  const filledSessions = song.sessions.filter((s) => s.status === "FILLED");

  const positionCounts: Record<string, number> = {};
  song.sessions.forEach(s => positionCounts[s.position] = (positionCounts[s.position] || 0) + 1);
  const positionRunningCounts: Record<string, number> = {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 animate-fade-in-up">
        <Link href="/songs" className="text-sm text-gray-800 font-bold hover:text-neo-pink font-black transition-colors">
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
          <div className="neo-card p-6">
            {isEditing ? (
              <form onSubmit={handleUpdateSong} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-black font-bold">유튜브 URL (선택)</label>
                    {isFetchingMeta && <span className="text-xs text-neo-pink font-black animate-pulse">정보 불러오는 중...</span>}
                  </div>
                  <input
                    type="url"
                    value={editForm.youtubeUrl}
                    onChange={(e) => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                    onBlur={(e) => fetchYoutubeMeta(e.target.value)}
                    className="w-full bg-white border-3 border-black neo-shadow border border-2 border-black rounded-none px-4 py-2 text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black"
                    placeholder="입력 시 자동 정보 추출"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-bold mb-1">제목</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white border-3 border-black neo-shadow border border-2 border-black rounded-none px-4 py-2 text-black font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-bold mb-1">아티스트</label>
                  <input
                    type="text"
                    required
                    value={editForm.artist}
                    onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                    className="w-full bg-white border-3 border-black neo-shadow border border-2 border-black rounded-none px-4 py-2 text-black font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-bold mb-1">설명 (선택)</label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-white border-3 border-black neo-shadow border border-2 border-black rounded-none px-4 py-2 text-black font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-black font-bold mb-1">난이도</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, difficulty: star })}
                        className={`text-2xl transition-colors ${
                          star <= editForm.difficulty ? "text-black font-black bg-neo-yellow px-1" : "text-gray-900"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-black font-bold mb-2">필요한 세션</label>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editForm.sessions.map((pos, index) => (
                      <div key={index} className={`flex items-center gap-1 px-3 py-1.5 rounded-none ${getPositionBadgeClass(pos)}`}>
                        <span className="text-sm">
                          {getPositionEmoji(pos)} {getPositionLabel(pos)}
                        </span>
                        <button type="button" onClick={() => removeSession(index)} className="opacity-70 hover:opacity-100 ml-1 transition-opacity">
                          ×
                        </button>
                      </div>
                    ))}
                    {editForm.sessions.length === 0 && <span className="text-gray-800 font-bold text-sm py-1.5">선택된 세션이 없습니다</span>}
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
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-none text-black font-bold hover:text-black font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-none neo-btn neo-btn-primary font-medium hover:bg-emerald-400"
                  >
                    저장
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-black font-black flex items-center gap-3">
                      {song.title}
                      <span className="text-sm px-2 py-0.5 rounded bg-gold-500/10 text-black font-black bg-neo-yellow px-1 border border-gold-500/20 whitespace-nowrap">
                        {"⭐".repeat(song.difficulty)}
                      </span>
                    </h1>
                    <p className="text-lg text-black font-bold mt-1">{song.artist}</p>
                  </div>
                  {(session?.user?.id === song.user.id || session?.user?.role === "ADMIN") && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEditClick}
                        className="p-2 rounded-none text-gray-800 hover:text-neo-pink font-black hover:neo-btn neo-btn-primary/10 transition-colors"
                        title="곡 수정"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDeleteSong}
                        className="p-2 rounded-none text-gray-800 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                        title="곡 삭제"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {song.description && (
                  <p className="mt-4 text-black font-bold text-sm leading-relaxed whitespace-pre-wrap">
                    {song.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-4 pt-4">
                  {song.user.image ? (
                    <img src={song.user.image} alt="" className="w-8 h-8 rounded-full border border-2 border-black object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-sm font-bold">
                      {song.user.name?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-black font-bold">{song.user.name}</p>
                    <p className="text-xs text-gray-800">{formatDate(song.createdAt)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session Panel */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="neo-card p-6">
            <h2 className="text-lg font-bold text-black font-black mb-4">🎸 세션 현황</h2>

            {song.sessions.length > 0 ? (
              <div className="space-y-3">
                {song.sessions.map((s) => {
                  positionRunningCounts[s.position] = (positionRunningCounts[s.position] || 0) + 1;
                  const displayLabel = positionCounts[s.position] > 1 
                    ? `${getPositionLabel(s.position)} ${positionRunningCounts[s.position]}`
                    : getPositionLabel(s.position);
                  
                  return (
                    <div
                      key={s.id}
                      className={`p-4 transition-all duration-200 border-3 border-black neo-shadow flex flex-col gap-3 ${
                        s.status === "FILLED"
                          ? "bg-gray-100"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${getPositionBadgeClass(s.position)}`}>
                          {getPositionEmoji(s.position)} {displayLabel}
                        </span>
                        <span className={`text-xs ${s.status === "OPEN" ? "text-neo-pink font-black" : "text-gray-800 font-bold"}`}>
                          {s.status === "OPEN" ? "모집 중" : "완료"}
                        </span>
                      </div>

                      {s.status === "FILLED" && s.user ? (
                        <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200 mt-1">
                          <div className="flex items-center gap-2">
                            {s.user.image ? (
                              <img src={s.user.image} alt="" className="w-6 h-6 rounded-full border-2 border-black object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-xs font-bold">
                                {s.user.name?.[0]}
                              </div>
                            )}
                            <span className="text-sm text-black font-black">{s.user.name}</span>
                          </div>
                          {session?.user?.id === s.user.id && (
                            <button
                              onClick={() => handleLeaveSession(s.id)}
                              className="text-xs px-3 py-1 font-black bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-colors border-2 border-black"
                            >
                              참여 취소
                            </button>
                          )}
                        </div>
                      ) : (
                        session?.user?.id && (
                          <button
                            onClick={() => handleJoinSession(s.id)}
                            className="w-full py-2 bg-neo-yellow text-black font-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-transform text-sm"
                          >
                            참여하기
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-800 font-bold text-sm text-center py-4">
                등록된 세션이 없습니다
              </p>
            )}

            {/* Summary */}
            {song.sessions.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-black">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-black font-black">진행률 (충원)</span>
                  <span className="text-black font-black">
                    {filledSessions.length} / {song.sessions.length}
                  </span>
                </div>
                <div className="h-4 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                  <div
                    className="h-full bg-neo-pink transition-all duration-500"
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

      {/* Comments Section */}
      <div className="mt-8 pt-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-bold text-black font-black mb-6 flex items-center gap-2">
          💬 댓글 <span className="text-neo-pink font-black text-sm">({comments.length})</span>
        </h2>

        {/* Comment Form */}
        {session ? (
          <form onSubmit={handleCreateComment} className="mb-8 flex gap-3">
            <div className="flex-shrink-0 pt-1">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-2 border-black object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-sm">
                  {session.user.name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 남겨보세요..."
                rows={2}
                className="neo-input resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 rounded-none bg-emerald-600 hover:neo-btn neo-btn-primary disabled:opacity-50 disabled:hover:bg-emerald-600 text-black text-sm font-medium transition-colors"
                >
                  등록
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-center text-black font-bold text-sm">
            댓글을 남기려면 <Link href="/login" className="text-neo-pink font-black hover:underline">로그인</Link>이 필요합니다.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 mt-8">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 py-4 border-b-2 border-gray-200">
              <div className="flex-shrink-0">
                {comment.user.image ? (
                  <img src={comment.user.image} alt="" className="w-8 h-8 rounded-full border border-2 border-black object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-sm">
                    {comment.user.name?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black font-black text-sm">{comment.user.name}</span>
                    {comment.user.role === "ADMIN" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/15 text-black font-black bg-neo-yellow px-1 border border-gold-500/20">
                        관리자
                      </span>
                    )}
                    <span className="text-xs text-gray-800">{formatDate(comment.createdAt)}</span>
                  </div>
                  {(session?.user?.id === comment.user.id || session?.user?.role === "ADMIN") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentContent(comment.content);
                        }}
                        className="text-xs text-gray-800 hover:text-neo-pink font-black transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-800 hover:text-danger-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                
                {editingCommentId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editingCommentContent}
                      onChange={(e) => setEditingCommentContent(e.target.value)}
                      rows={2}
                      className="w-full bg-white border-3 border-black neo-shadow border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black resize-none text-sm"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1.5 rounded-none text-black font-bold hover:text-black font-bold text-xs transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editingCommentContent.trim()}
                        className="px-3 py-1.5 rounded-none bg-emerald-600/20 text-neo-pink font-black hover:bg-emerald-600/30 disabled:opacity-50 text-xs transition-colors"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-black font-bold text-sm whitespace-pre-wrap leading-relaxed mt-1">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-800 font-bold text-sm">
              첫 댓글을 남겨보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
