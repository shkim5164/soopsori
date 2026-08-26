"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDate, parsePositions, stringifyPositions, type RankedPosition } from "@/lib/constants";
import PositionPicker from "@/components/PositionPicker";
import PositionBadges from "@/components/PositionBadges";

interface PointHistory {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [positions, setPositions] = useState<RankedPosition[]>(parsePositions(session?.user?.position));
  const [name, setName] = useState(session?.user?.name ?? "");
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setPositions(parsePositions(session.user.position));
      setName(session.user.name ?? "");
    }
  }, [session]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/members/${session.user.id}/points`);
        if (res.ok) setPointHistory(await res.json());
      } catch {
        // API might not exist yet, that's ok
      }
    };
    fetchHistory();
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${session.user.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: stringifyPositions(positions), name }),
      });
      if (res.ok) {
        setSaved(true);
        update();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">🔒</span>
        <h1 className="text-xl font-bold text-neutral-300">로그인이 필요합니다</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-neutral-100 mb-8 animate-fade-in-up">👤 내 프로필</h1>

      {/* Profile Card */}
      <div className="glass-card-static p-6 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-4 mb-6">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="w-16 h-16 rounded-full border-2 border-forest-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-forest-700 flex items-center justify-center text-2xl border-2 border-forest-600">
              {session.user.name?.[0]}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{session.user.name}</h2>
            <p className="text-sm text-neutral-500">{session.user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-gold-400">⭐ {session.user.points ?? 0}P</span>
              {session.user.role === "ADMIN" && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-400">관리자</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">포지션 (1~3순위 및 기타)</label>
            <PositionPicker value={positions} onChange={setPositions} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              saved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white hover:shadow-lg hover:shadow-emerald-500/20"
            }`}
          >
            {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "프로필 저장"}
          </button>
        </div>
      </div>

      {/* Point History */}
      <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-lg font-bold text-neutral-100 mb-4">📊 포인트 이력</h3>
        {pointHistory.length > 0 ? (
          <div className="space-y-2">
            {pointHistory.map((ph) => (
              <div key={ph.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-forest-900/30 transition-colors">
                <div>
                  <p className="text-sm text-neutral-300">{ph.reason}</p>
                  <p className="text-xs text-neutral-600">{formatDate(ph.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${ph.amount > 0 ? "text-emerald-400" : "text-danger-400"}`}>
                  {ph.amount > 0 ? "+" : ""}{ph.amount}P
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm text-center py-4">아직 포인트 이력이 없습니다</p>
        )}
      </div>
    </div>
  );
}
