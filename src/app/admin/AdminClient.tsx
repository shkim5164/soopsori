"use client";

import { useState, useEffect } from "react";
import PositionBadges from "@/components/PositionBadges";

interface Member {
  id: string;
  username: string; // added to display username
  name: string;
  email: string;
  image: string;
  position: string | null;
  points: number;
  role: string;
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

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
          alert(`추가 실패: ${errData.error}`);
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
          alert(`수정 실패: ${errData.error}`);
        }
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">⚙️ 회원 관리 (Admin)</h1>
          <p className="text-neutral-500 mt-1">
            전체 회원 목록을 확인하고, 회원을 추가/수정/삭제 및 포인트를 관리할 수 있습니다.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          + 회원 추가
        </button>
      </div>

      <div className="bg-forest-900/40 rounded-xl overflow-hidden border border-forest-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-forest-800/50 text-neutral-300 text-sm border-b border-forest-700/50">
                <th className="p-4 font-medium">회원</th>
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
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    로딩 중...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-forest-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-10 h-10 rounded-full border border-forest-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-sm border border-forest-600 text-emerald-400 font-bold">
                            {member.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-neutral-200 font-medium">
                            {member.name} <span className="text-neutral-500 text-xs">({member.username})</span>
                          </p>
                          <p className="text-xs text-neutral-500">{member.email || "이메일 없음"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        member.role === 'ADMIN' ? 'bg-gold-500/20 text-gold-400' : 'bg-neutral-500/20 text-neutral-400'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {member.position ? <PositionBadges positionStr={member.position} /> : <span className="text-xs text-neutral-500">-</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-gold-400">
                      {member.points}P
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          value={editingPoints[member.id] !== undefined ? editingPoints[member.id] : member.points}
                          onChange={(e) => handlePointChange(member.id, e.target.value)}
                          className="w-full bg-forest-800 border border-forest-600 rounded px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                          placeholder="수정할 포인트"
                        />
                        <input
                          type="text"
                          value={editReason[member.id] || ""}
                          onChange={(e) => handleReasonChange(member.id, e.target.value)}
                          className="w-full bg-forest-800 border border-forest-600 rounded px-3 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                          placeholder="수정 사유 (선택)"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col gap-2 justify-center items-center">
                        <button
                          onClick={() => handleUpdatePoints(member.id, member.points)}
                          disabled={editingPoints[member.id] === undefined || editingPoints[member.id] === member.points}
                          className="px-3 py-1.5 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-forest-700 disabled:text-neutral-500 text-white text-xs font-medium rounded transition-colors"
                        >
                          포인트 저장
                        </button>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => openEditModal(member)}
                            className="flex-1 px-2 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded transition-colors"
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
          <div className="bg-forest-900 border border-forest-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-100 mb-4">
                {modalMode === "ADD" ? "새 회원 추가" : "회원 정보 수정"}
              </h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {modalMode === "ADD" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">아이디 (Username) *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    비밀번호 {modalMode === "ADD" ? "*" : "(변경 시에만 입력)"}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "ADD"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">닉네임 / 이름</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">포지션 (콤마로 구분)</label>
                  <input
                    type="text"
                    placeholder="예: 보컬, 어쿠스틱 기타"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">역할 (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-forest-800 border border-forest-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MEMBER">일반 회원 (MEMBER)</option>
                    <option value="ADMIN">관리자 (ADMIN)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-forest-800 hover:bg-forest-700 text-neutral-300 rounded-lg font-medium transition-colors border border-forest-600"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
                  >
                    {submitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
