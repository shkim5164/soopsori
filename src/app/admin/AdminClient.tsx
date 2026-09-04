"use client";

import { useState, useEffect } from "react";
import PositionBadges from "@/components/PositionBadges";
import PositionPicker from "@/components/PositionPicker";
import { parsePositions, stringifyPositions } from "@/lib/constants";
import Link from "next/link";

interface Member {
  id: string;
  username: string; // added to display username
  name: string;
  email: string;
  image: string;
  position: string | null;
  points: number;
  role: string;
  songs: { id: string; title: string }[];
  songSessions: { song: { id: string; title: string } }[];
  meetingAttendances: { meeting: { id: string; title: string } }[];
  _count: {
    songs: number;
    meetingAttendances: number;
  };
}

export default function AdminClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPoints, setEditingPoints] = useState<{ [key: string]: number }>({});
  const [editReason, setEditReason] = useState<{ [key: string]: string }>({});

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    password: "",
    name: "",
    email: "",
    position: "",
    role: "MEMBER",
  });
  const [formErrors, setFormErrors] = useState<{username?: string, name?: string, general?: string}>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handlePointChange = (id: string, value: string) => {
    setEditingPoints(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
  };

  const handleReasonChange = (id: string, value: string) => {
    setEditReason(prev => ({ ...prev, [id]: value }));
  };

  const handleUpdatePoints = async (id: string, currentPoints: number) => {
    const newPoints = editingPoints[id];
    if (newPoints === undefined || newPoints === currentPoints) return;

    try {
      const res = await fetch(`/api/admin/members/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: newPoints,
          reason: editReason[id] || "어드민 포인트 변경",
        }),
      });

      if (res.ok) {
        alert("포인트가 성공적으로 업데이트되었습니다.");
        const updatedUser = await res.json();
        setMembers(members.map(m => m.id === id ? { ...m, points: updatedUser.points } : m));
        setEditingPoints(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        setEditReason(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      } else {
        const errData = await res.json();
        alert(`포인트 업데이트 실패: ${errData.error}`);
      }
    } catch (error) {
      console.error("Failed to update points:", error);
      alert("포인트 업데이트 중 오류가 발생했습니다.");
    }
  };

  // -------------------------
  // 회원 추가/수정/삭제 로직
  // -------------------------

  const openAddModal = () => {
    setModalMode("ADD");
    setFormData({
      id: "",
      username: "",
      password: "",
      name: "",
      email: "",
      position: "",
      role: "MEMBER",
    });
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setModalMode("EDIT");
    setFormData({
      id: member.id,
      username: member.username || "",
      password: "", // 빈 칸으로 두면 변경 안 함
      name: member.name || "",
      email: member.email || "",
      position: member.position || "",
      role: member.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} 회원을 삭제하시겠습니까?\n해당 회원이 등록한 곡, 참석 내역 등 연관 데이터가 모두 삭제될 수 있습니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("회원이 삭제되었습니다.");
        fetchMembers(); // 새로고침
      } else {
        const errData = await res.json();
        alert(`삭제 실패: ${errData.error}`);
      }
    } catch (error) {
      console.error("Failed to delete member:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      if (modalMode === "ADD") {
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          alert("회원이 추가되었습니다.");
          setShowModal(false);
          fetchMembers();
        } else {
          const errData = await res.json();
          if (errData.error?.includes("아이디")) setFormErrors({ username: errData.error });
          else if (errData.error?.includes("닉네임") || errData.error?.includes("이름")) setFormErrors({ name: errData.error });
          else setFormErrors({ general: errData.error });
        }
      } else {
        const res = await fetch(`/api/admin/members/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            position: formData.position,
            role: formData.role,
            password: formData.password ? formData.password : undefined,
          }),
        });

        if (res.ok) {
          alert("회원 정보가 수정되었습니다.");
          setShowModal(false);
          fetchMembers();
        } else {
          const errData = await res.json();
          if (errData.error?.includes("닉네임") || errData.error?.includes("이름")) setFormErrors({ name: errData.error });
          else setFormErrors({ general: errData.error });
        }
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      setFormErrors({ general: "저장 중 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-black font-black">⚙️ 회원 관리 (Admin)</h1>
          <p className="text-gray-800 font-bold mt-1">
            전체 회원 목록을 확인하고, 회원을 추가/수정/삭제 및 포인트를 관리할 수 있습니다.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:neo-btn neo-btn-primary rounded-none font-medium transition-colors"
        >
          + 회원 추가
        </button>
      </div>

      <div className="bg-white border-3 border-black neo-shadow rounded-none overflow-hidden border border-2 border-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-2 border-black neo-shadow text-black font-bold text-sm">
                <th className="p-4 font-medium">회원</th>
                <th className="p-4 font-medium">활동 내역</th>
                <th className="p-4 font-medium">역할</th>
                <th className="p-4 font-medium">포지션</th>
                <th className="p-4 font-medium text-center">현재 포인트</th>
                <th className="p-4 font-medium min-w-[200px]">포인트 수정</th>
                <th className="p-4 font-medium text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-700/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-800 font-bold">
                    로딩 중...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-800 font-bold">
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-white border-2 border-black neo-shadow transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-10 h-10 rounded-full border border-2 border-black"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-sm border border-2 border-black text-neo-pink font-black font-bold">
                            {member.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-black font-black font-medium">
                            {member.name} <span className="text-gray-800 font-bold text-xs">({member.username})</span>
                          </p>
                          <p className="text-xs text-gray-800 font-bold">{member.email || "이메일 없음"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs space-y-1.5 max-w-[250px]">
                      <div className="line-clamp-1">
                        <span className="font-bold text-black">등록:</span> <span className="text-gray-800">{member.songs?.length || 0}곡</span>
                      </div>
                      <div className="line-clamp-1">
                        <span className="font-bold text-black">참여:</span> <span className="text-gray-800">{Array.from(new Set(member.songSessions?.map(s => s.song.id))).length || 0}곡</span>
                      </div>
                      <div className="line-clamp-1">
                        <span className="font-bold text-black">모임:</span> <span className="text-gray-800">{member.meetingAttendances?.length || 0}회</span>
                      </div>
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="mt-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-black border border-black rounded transition-colors text-xs font-bold"
                      >
                        상세 보기
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        member.role === 'ADMIN' ? 'bg-gold-500/20 text-black font-black bg-neo-yellow px-1' : 'bg-neutral-500/20 text-black font-bold'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {member.position ? <PositionBadges positionStr={member.position} /> : <span className="text-xs text-gray-800 font-bold">-</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-black font-black bg-neo-yellow px-1">
                      {member.points}P
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          value={editingPoints[member.id] !== undefined ? editingPoints[member.id] : member.points}
                          onChange={(e) => handlePointChange(member.id, e.target.value)}
                          className="w-full bg-white border-2 border-black border border-2 border-black rounded px-3 py-1.5 text-sm text-black font-black focus:outline-none focus:border-3 border-black"
                          placeholder="수정할 포인트"
                        />
                        <input
                          type="text"
                          value={editReason[member.id] || ""}
                          onChange={(e) => handleReasonChange(member.id, e.target.value)}
                          className="w-full bg-white border-2 border-black border border-2 border-black rounded px-3 py-1 text-xs text-black font-black focus:outline-none focus:border-3 border-black"
                          placeholder="수정 사유 (선택)"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col gap-2 justify-center items-center">
                        <button
                          onClick={() => handleUpdatePoints(member.id, member.points)}
                          disabled={editingPoints[member.id] === undefined || editingPoints[member.id] === member.points}
                          className="px-3 py-1.5 w-full bg-emerald-600 hover:neo-btn neo-btn-primary disabled:bg-neo-yellow border-2 border-black text-black disabled:text-gray-800 font-bold text-black text-xs font-medium rounded transition-colors"
                        >
                          포인트 저장
                        </button>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => openEditModal(member)}
                            className="flex-1 px-2 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-black text-xs font-medium rounded transition-colors"
                          >
                            정보 수정
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="flex-1 px-2 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-medium rounded transition-colors border border-red-800/50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 회원 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-3 border-black border border-2 border-black rounded-none w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black font-black mb-4">
                {modalMode === "ADD" ? "새 회원 추가" : "회원 정보 수정"}
              </h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {modalMode === "ADD" && (
                  <div>
                    <label className="block text-sm font-medium text-black font-bold mb-1">아이디 (Username) *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-white border-2 border-black border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black"
                    />
                    {formErrors.username && (
                      <p className="text-sm text-red-500 font-bold mt-1">{formErrors.username}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-black font-bold mb-1">
                    비밀번호 {modalMode === "ADD" ? "*" : "(변경 시에만 입력)"}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "ADD"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border-2 border-black border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black font-bold mb-1">닉네임 / 이름</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border-2 border-black border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 font-bold mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black font-bold mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border-2 border-black border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black font-bold mb-1">포지션 (Position)</label>
                  <PositionPicker 
                    value={parsePositions(formData.position)} 
                    onChange={(val) => setFormData({ ...formData, position: stringifyPositions(val) })} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black font-bold mb-1">역할 (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border-2 border-black border border-2 border-black rounded-none px-4 py-2 text-black font-black focus:outline-none focus:border-3 border-black"
                  >
                    <option value="MEMBER">일반 회원 (MEMBER)</option>
                    <option value="ADMIN">관리자 (ADMIN)</option>
                  </select>
                </div>
                
                {formErrors.general && (
                  <div className="p-3 bg-red-100 border border-red-200">
                    <p className="text-sm text-red-500 font-bold">{formErrors.general}</p>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-white border-2 border-black hover:bg-neo-yellow border-2 border-black text-black text-black font-bold rounded-none font-medium transition-colors border border-2 border-black"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:neo-btn neo-btn-primary disabled:bg-emerald-800 text-black rounded-none font-medium transition-colors"
                  >
                    {submitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-3 border-black border border-2 border-black rounded-none w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b-2 border-black bg-neo-yellow flex justify-between items-center">
              <h2 className="text-xl font-bold text-black font-black">
                {selectedMember.name} 님의 활동 내역
              </h2>
              <button onClick={() => setSelectedMember(null)} className="text-black font-black text-xl hover:text-gray-700">
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="font-bold text-lg border-b-2 border-black pb-2 mb-3">등록한 곡</h3>
                {selectedMember.songs && selectedMember.songs.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedMember.songs.map(song => (
                      <li key={`reg-${song.id}`}>
                        <Link href={`/songs/${song.id}`} className="text-blue-700 hover:text-neo-pink font-bold underline decoration-2 underline-offset-2">
                          {song.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 font-medium">등록한 곡이 없습니다.</p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-lg border-b-2 border-black pb-2 mb-3">참여한 곡</h3>
                {selectedMember.songSessions && selectedMember.songSessions.length > 0 ? (
                  <ul className="space-y-2">
                    {Array.from(new Map(selectedMember.songSessions.map(s => [s.song.id, s.song])).values()).map(song => (
                      <li key={`part-${song.id}`}>
                        <Link href={`/songs/${song.id}`} className="text-blue-700 hover:text-neo-pink font-bold underline decoration-2 underline-offset-2">
                          {song.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 font-medium">참여한 곡이 없습니다.</p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-lg border-b-2 border-black pb-2 mb-3">참여 모임</h3>
                {selectedMember.meetingAttendances && selectedMember.meetingAttendances.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedMember.meetingAttendances.map(m => (
                      <li key={`meet-${m.meeting.id}`}>
                        <Link href={`/meetings/${m.meeting.id}`} className="text-blue-700 hover:text-neo-pink font-bold underline decoration-2 underline-offset-2">
                          {m.meeting.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 font-medium">참여한 모임이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-6 py-2 bg-white border-2 border-black hover:bg-neo-yellow text-black font-bold rounded-none transition-colors border border-2 border-black"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
