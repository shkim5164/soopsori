"use client";

import { useState, useEffect } from "react";
import PositionBadges from "@/components/PositionBadges";

interface Member {
  id: string;
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: newPoints,
          reason: editReason[id] || "어드민 포인트 변경",
        }),
      });

      if (res.ok) {
        // 성공적으로 변경 시 데이터 다시 불러오기
        alert("포인트가 성공적으로 업데이트되었습니다.");
        const updatedUser = await res.json();
        setMembers(members.map(m => m.id === id ? { ...m, points: updatedUser.points } : m));
        // 편집 상태 초기화
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-neutral-100">⚙️ 회원 관리 (Admin)</h1>
        <p className="text-neutral-500 mt-1">
          전체 회원 목록을 확인하고 포인트를 관리할 수 있습니다.
        </p>
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
                          <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-sm border border-forest-600">
                            {member.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-neutral-200 font-medium">{member.name}</p>
                          <p className="text-xs text-neutral-500">{member.email}</p>
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
                      {member.position && <PositionBadges positionStr={member.position} />}
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
                      <button
                        onClick={() => handleUpdatePoints(member.id, member.points)}
                        disabled={editingPoints[member.id] === undefined || editingPoints[member.id] === member.points}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-forest-700 disabled:text-neutral-500 text-white text-sm font-medium rounded transition-colors"
                      >
                        저장
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
