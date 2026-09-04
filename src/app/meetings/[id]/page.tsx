"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import CreateSongModal from "@/components/CreateSongModal";
import { formatDateTime, getPositionLabel, getPositionBadgeClass, formatDateForInput } from "@/lib/constants";
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
  creatorId: string | null;
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
  const [isCreateSongOpen, setIsCreateSongOpen] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allMembers, setAllMembers] = useState<{id: string, name: string}[]>([]);
  const [adminSelectedUserId, setAdminSelectedUserId] = useState("");

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
    if (session?.user?.role === "ADMIN") {
      fetch("/api/members").then(res => res.ok && res.json()).then(data => setAllMembers(data || []));
    }
  }, [id, session?.user?.role]);

  const handleAddSong = async (songIdToAdd?: string | React.FormEvent) => {
    const idToAdd = typeof songIdToAdd === "string" ? songIdToAdd : selectedSongId;
    if (!idToAdd) return;
    try {
      const res = await fetch(`/api/meetings/${id}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: idToAdd }),
      });
      if (res.ok) {
        setIsAddSongOpen(false);
        setSelectedSongId("");
        setSearchQuery("");
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", date: "", description: "", status: "" });

  const handleEditClick = () => {
    if (meeting) {
      setEditForm({
        title: meeting.title,
        date: formatDateForInput(meeting.date),
        description: meeting.description || "",
        status: meeting.status,
      });
      setIsEditOpen(true);
    }
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          date: new Date(editForm.date).toISOString(),
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        fetchMeeting();
      }
    } catch (error) {
      console.error("Failed to update meeting:", error);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm("정말 이 모임을 삭제하시겠습니까? (연결된 모든 세트리스트와 참석 기록이 함께 삭제됩니다)")) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/meetings";
      }
    } catch (error) {
      console.error("Failed to delete meeting:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-64 w-full rounded-none" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">😢</span>
        <h1 className="text-xl font-bold text-black font-bold">모임을 찾을 수 없습니다</h1>
        <Link href="/meetings" className="text-neo-pink font-black hover:text-neo-pink font-black text-sm mt-2 inline-block">
          ← 모임 목록으로
        </Link>
      </div>
    );
  }

  const isUpcoming = meeting.status === "UPCOMING";
  const myAttendance = meeting.attendances.find((a) => a.user.id === session?.user?.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/meetings" className="text-sm text-gray-800 font-bold hover:text-neo-pink font-black transition-colors mb-6 inline-block">
        ← 모임 목록
      </Link>

      {/* Header */}
      <div className="neo-card p-6 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-black font-black">{meeting.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isUpcoming ? "neo-btn neo-btn-primary/15 text-neo-pink font-black" : "bg-neo-yellow border-2 border-black text-black text-gray-800 font-bold"
              }`}>
                {isUpcoming ? "예정" : meeting.status === "COMPLETED" ? "완료" : "취소"}
              </span>
            </div>
            <p className="text-black font-bold mt-1">{formatDateTime(meeting.date)}</p>
            {meeting.description && <p className="text-gray-800 font-bold text-sm mt-2">{meeting.description}</p>}
          </div>

          <div className="flex gap-2">
            {isUpcoming && session?.user && (
              <button
                onClick={() => handleToggleAttendance()}
                className={`px-4 py-2 rounded-none text-sm font-medium transition-all duration-200 ${
                  myAttendance?.attended
                    ? "neo-btn neo-btn-primary/20 text-neo-pink font-black border border-3 border-black"
                    : "bg-white border-3 border-black neo-shadow text-black font-bold border border-2 border-black hover:border-3 border-black"
                }`}
              >
                {myAttendance?.attended ? "✅ 참석 예정" : "참석하기"}
              </button>
            )}
            {isUpcoming && session?.user?.role === "ADMIN" && (
              <button
                onClick={handleCompleteMeeting}
                className="px-4 py-2 rounded-none bg-gold-500/15 text-black font-black bg-neo-yellow px-1 border border-gold-500/20 hover:bg-gold-500/25 text-sm font-medium transition-all"
              >
                모임 완료 처리
              </button>
            )}
            {(meeting.creatorId === session?.user?.id || session?.user?.role === "ADMIN") && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={handleEditClick}
                  className="p-2 rounded-none text-gray-800 font-bold hover:text-neo-pink font-black hover:neo-btn neo-btn-primary/10 transition-colors"
                  title="모임 수정"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteMeeting}
                  className="p-2 rounded-none text-gray-800 font-bold hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                  title="모임 삭제"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setlist */}
        <div className="lg:col-span-2 neo-card p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-black">🎵 세트리스트</h2>
            {isUpcoming && session?.user && (
              <button
                onClick={() => {
                  fetchSongs();
                  setIsAddSongOpen(true);
                }}
                className="text-sm px-3 py-1.5 rounded-none neo-btn neo-btn-primary/15 text-neo-pink font-black hover:neo-btn neo-btn-primary/25 transition-colors"
              >
                + 곡 추가
              </button>
            )}
          </div>

          {meeting.meetingSongs.length > 0 ? (
            <div className="space-y-3">
              {meeting.meetingSongs.map((ms, i) => (
                <div key={ms.id} className="p-4 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black hover:border-2 border-black transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-800 w-8 text-right">{ms.orderNum}.</span>
                    <div className="flex-1">
                      <Link href={`/songs/${ms.song.id}`} className="text-black font-black font-semibold hover:text-neo-pink font-black transition-colors">
                        {ms.song.title}
                      </Link>
                      <p className="text-sm text-gray-800 font-bold">{ms.song.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ms.picker.image && <img src={ms.picker.image} alt="" className="w-6 h-6 rounded-full" />}
                      <div className="text-right">
                        <p className="text-xs text-black font-bold">{ms.picker.name}</p>
                        <p className="text-xs text-black font-black bg-neo-yellow px-1">{ms.picker.points}P</p>
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
              <p className="text-gray-800 font-bold">아직 등록된 곡이 없습니다</p>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="neo-card p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-bold text-black font-black mb-4">
            👥 참석자 ({meeting.attendances.filter((a) => a.attended).length}명)
          </h2>
          <div className="space-y-2">
            {meeting.attendances.filter((a) => a.attended).map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-none hover:bg-white border-3 border-black neo-shadow transition-colors">
                {a.user.image ? (
                  <img src={a.user.image} alt="" className="w-7 h-7 rounded-full border border-2 border-black" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-xs">
                    {a.user.name?.[0]}
                  </div>
                )}
                <span className="text-sm text-black font-bold">{a.user.name}</span>
                <span className="text-xs text-neo-pink font-black ml-auto">✓</span>
                {session?.user?.role === "ADMIN" && (
                  <button 
                    onClick={() => handleToggleAttendance(a.user.id)}
                    className="ml-2 text-danger-400 font-bold hover:text-red-700"
                    title="참석 취소"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {meeting.attendances.filter((a) => a.attended).length === 0 && (
              <p className="text-gray-800 font-bold text-sm text-center py-4">아직 참석자가 없습니다</p>
            )}
          </div>
          
          {session?.user?.role === "ADMIN" && (
            <div className="mt-6 border-t-2 border-black pt-4">
              <h3 className="text-sm font-bold text-black mb-2 flex items-center gap-1">
                <span className="text-neo-pink">⚙️</span> 관리자 메뉴: 참석자 추가
              </h3>
              <div className="flex gap-2">
                <select 
                  className="neo-input flex-1 p-2 text-sm"
                  value={adminSelectedUserId}
                  onChange={(e) => setAdminSelectedUserId(e.target.value)}
                >
                  <option value="">참석자를 선택하세요</option>
                  {allMembers
                    .filter(member => !meeting.attendances.some(a => a.user.id === member.id && a.attended))
                    .map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => {
                    if (adminSelectedUserId) {
                      handleToggleAttendance(adminSelectedUserId);
                      setAdminSelectedUserId("");
                    }
                  }}
                  disabled={!adminSelectedUserId}
                  className="neo-btn neo-btn-primary px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal */}
      <Modal isOpen={isAddSongOpen} onClose={() => {
        setIsAddSongOpen(false);
        setSearchQuery("");
        setSelectedSongId("");
      }} title="세트리스트에 곡 추가">
        <div className="flex gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="곡 제목 또는 아티스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
          />
          <button
            onClick={() => {
              setIsAddSongOpen(false);
              setIsCreateSongOpen(true);
            }}
            className="px-4 py-2 rounded-none neo-btn neo-btn-primary/15 text-neo-pink font-black border border-3 border-black hover:neo-btn neo-btn-primary/25 transition-colors text-sm font-medium whitespace-nowrap"
          >
            + 새 곡 등록
          </button>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
          {availableSongs
            .filter(song => 
              song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              song.artist.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((song) => {
            const isAlreadyAdded = meeting.meetingSongs.some((ms) => ms.song.id === song.id);
            return (
              <button
                key={song.id}
                onClick={() => !isAlreadyAdded && setSelectedSongId(song.id)}
                disabled={isAlreadyAdded}
                className={`w-full text-left p-3 rounded-none border transition-all duration-200 ${
                  isAlreadyAdded
                    ? "border-2 border-black bg-white border-3 border-black neo-shadow opacity-50 cursor-not-allowed"
                    : selectedSongId === song.id
                    ? "border-3 border-black neo-btn neo-btn-primary/10"
                    : "border-2 border-black bg-white border-3 border-black neo-shadow hover:border-2 border-black"
                }`}
              >
                <p className="text-sm font-medium text-black font-black">{song.title}</p>
                <p className="text-xs text-gray-800 font-bold">{song.artist}</p>
                {isAlreadyAdded && <span className="text-xs text-gray-800">이미 추가됨</span>}
              </button>
            );
          })}
          {availableSongs.filter(song => 
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-800 font-bold">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddSongOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow text-black font-bold hover:text-black font-black transition-colors text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleAddSong}
            disabled={!selectedSongId}
            className="flex-1 px-4 py-2.5 rounded-none neo-btn neo-btn-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            선택한 곡 추가하기
          </button>
        </div>
      </Modal>

      {/* Create Song Modal */}
      <CreateSongModal
        isOpen={isCreateSongOpen}
        onClose={() => setIsCreateSongOpen(false)}
        onSuccess={(songId) => {
          setIsCreateSongOpen(false);
          handleAddSong(songId);
        }}
      />

      {/* Edit Meeting Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="모임 수정">
        <form onSubmit={handleUpdateMeeting} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">제목 *</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">날짜 및 시간 *</label>
            <input
              type="datetime-local"
              required
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors [&::-webkit-calendar-picker-indicator]:invert-[0.8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">상태</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
            >
              <option value="UPCOMING">예정</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">설명 (선택)</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow text-black font-bold hover:text-black font-black transition-colors text-sm font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-none neo-btn neo-btn-primary text-sm font-medium transition-all"
            >
              저장하기
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
