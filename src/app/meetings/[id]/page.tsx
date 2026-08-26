"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import { formatDateTime, getPositionLabel, getPositionBadgeClass } from "@/lib/constants";
import Link from "next/link";

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string | null;
  status: string;
  meetingSongs: {
    id: string;
    orderNum: number;
    song: {
      id: string;
      title: string;
      artist: string;
      sessions: { id: string; position: string; status: string; user: { id: string; name: string; image: string } | null }[];
    };
    picker: { id: string; name: string; image: string; points: number };
    participants: { id: string; position: string; user: { id: string; name: string; image: string } }[];
  }[];
  attendances: { id: string; attended: boolean; user: { id: string; name: string; image: string } }[];
}

interface Song {
  id: string;
  title: string;
  artist: string;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState("");

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (res.ok) setMeeting(await res.json());
    } catch (error) {
      console.error("Failed to fetch meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async () => {
    try {
      const res = await fetch("/api/songs");
      if (res.ok) setAvailableSongs(await res.json());
    } catch (error) {
      console.error("Failed to fetch songs:", error);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const handleAddSong = async () => {
    if (!selectedSongId) return;
    try {
      const res = await fetch(`/api/meetings/${id}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: selectedSongId }),
      });
      if (res.ok) {
        setIsAddSongOpen(false);
        setSelectedSongId("");
        fetchMeeting();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to add song:", error);
    }
  };

  const handleToggleAttendance = async (userId?: string) => {
    try {
      const targetUserId = userId || session?.user?.id;
      const currentAttendance = meeting?.attendances.find((a) => a.user.id === targetUserId);
      
      const res = await fetch(`/api/meetings/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          attended: !currentAttendance?.attended,
        }),
      });
      if (res.ok) fetchMeeting();
    } catch (error) {
      console.error("Failed to toggle attendance:", error);
    }
  };

  const handleCompleteMeeting = async () => {
    if (!confirm("모임을 완료 처리하시겠습니까?\n\n참석자에게 +100P, 선곡자에게 -200P가 적용됩니다.")) return;
    try {
      const res = await fetch(`/api/meetings/${id}/complete`, { method: "POST" });
      if (res.ok) {
        alert("모임이 완료 처리되었습니다!");
        fetchMeeting();
      }
    } catch (error) {
      console.error("Failed to complete meeting:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">😢</span>
        <h1 className="text-xl font-bold text-neutral-300">모임을 찾을 수 없습니다</h1>
        <Link href="/meetings" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
          ← 모임 목록으로
        </Link>
      </div>
    );
  }

  const isUpcoming = meeting.status === "UPCOMING";
  const myAttendance = meeting.attendances.find((a) => a.user.id === session?.user?.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/meetings" className="text-sm text-neutral-500 hover:text-emerald-400 transition-colors mb-6 inline-block">
        ← 모임 목록
      </Link>

      {/* Header */}
      <div className="glass-card-static p-6 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-100">{meeting.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isUpcoming ? "bg-emerald-500/15 text-emerald-400" : "bg-forest-700/30 text-neutral-500"
              }`}>
                {isUpcoming ? "예정" : meeting.status === "COMPLETED" ? "완료" : "취소"}
              </span>
            </div>
            <p className="text-neutral-400 mt-1">{formatDateTime(meeting.date)}</p>
            {meeting.description && <p className="text-neutral-500 text-sm mt-2">{meeting.description}</p>}
          </div>

          <div className="flex gap-2">
            {isUpcoming && session?.user && (
              <button
                onClick={() => handleToggleAttendance()}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  myAttendance?.attended
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-forest-900/40 text-neutral-400 border border-forest-700/30 hover:border-emerald-500/30"
                }`}
              >
                {myAttendance?.attended ? "✅ 참석 예정" : "참석하기"}
              </button>
            )}
            {isUpcoming && session?.user?.role === "ADMIN" && (
              <button
                onClick={handleCompleteMeeting}
                className="px-4 py-2 rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/20 hover:bg-gold-500/25 text-sm font-medium transition-all"
              >
                모임 완료 처리
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setlist */}
        <div className="lg:col-span-2 glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-100">🎵 세트리스트</h2>
            {isUpcoming && session?.user && (
              <button
                onClick={() => {
                  fetchSongs();
                  setIsAddSongOpen(true);
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              >
                + 곡 추가
              </button>
            )}
          </div>

          {meeting.meetingSongs.length > 0 ? (
            <div className="space-y-3">
              {meeting.meetingSongs.map((ms, i) => (
                <div key={ms.id} className="p-4 rounded-xl bg-forest-900/20 border border-forest-700/10 hover:border-forest-700/30 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-neutral-600 w-8 text-right">{ms.orderNum}.</span>
                    <div className="flex-1">
                      <Link href={`/songs/${ms.song.id}`} className="text-neutral-100 font-semibold hover:text-emerald-400 transition-colors">
                        {ms.song.title}
                      </Link>
                      <p className="text-sm text-neutral-500">{ms.song.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ms.picker.image && <img src={ms.picker.image} alt="" className="w-6 h-6 rounded-full" />}
                      <div className="text-right">
                        <p className="text-xs text-neutral-400">{ms.picker.name}</p>
                        <p className="text-xs text-gold-400">{ms.picker.points}P</p>
                      </div>
                    </div>
                  </div>

                  {/* Participants */}
                  {ms.participants.length > 0 && (
                    <div className="ml-11 flex flex-wrap gap-2 mt-2">
                      {ms.participants.map((p) => (
                        <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(p.position)}`}>
                          {getPositionLabel(p.position)}: {p.user.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">아직 등록된 곡이 없습니다</p>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-bold text-neutral-100 mb-4">
            👥 참석자 ({meeting.attendances.filter((a) => a.attended).length}명)
          </h2>
          <div className="space-y-2">
            {meeting.attendances.filter((a) => a.attended).map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-forest-900/30 transition-colors">
                {a.user.image ? (
                  <img src={a.user.image} alt="" className="w-7 h-7 rounded-full border border-forest-700" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-xs">
                    {a.user.name?.[0]}
                  </div>
                )}
                <span className="text-sm text-neutral-300">{a.user.name}</span>
                <span className="text-xs text-emerald-400 ml-auto">✓</span>
              </div>
            ))}
            {meeting.attendances.filter((a) => a.attended).length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">아직 참석자가 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Song Modal */}
      <Modal isOpen={isAddSongOpen} onClose={() => setIsAddSongOpen(false)} title="세트리스트에 곡 추가">
        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
          {availableSongs.map((song) => {
            const isAlreadyAdded = meeting.meetingSongs.some((ms) => ms.song.id === song.id);
            return (
              <button
                key={song.id}
                onClick={() => !isAlreadyAdded && setSelectedSongId(song.id)}
                disabled={isAlreadyAdded}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                  isAlreadyAdded
                    ? "border-forest-700/10 bg-forest-900/10 opacity-50 cursor-not-allowed"
                    : selectedSongId === song.id
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-forest-700/20 bg-forest-900/20 hover:border-forest-700/40"
                }`}
              >
                <p className="text-sm font-medium text-neutral-200">{song.title}</p>
                <p className="text-xs text-neutral-500">{song.artist}</p>
                {isAlreadyAdded && <span className="text-xs text-neutral-600">이미 추가됨</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddSongOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900/40 text-neutral-400 hover:text-neutral-200 transition-colors text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleAddSong}
            disabled={!selectedSongId}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            추가하기
          </button>
        </div>
      </Modal>
    </div>
  );
}
