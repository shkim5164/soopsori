"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDate, parsePositions, stringifyPositions, getPositionBadgeClass, getPositionLabel, type RankedPosition } from "@/lib/constants";
import PositionPicker from "@/components/PositionPicker";

interface PointHistory {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface ActivityData {
  registeredSongs: {
    id: string;
    title: string;
    artist: string;
    createdAt: string;
    difficulty: number;
  }[];
  appliedSessions: {
    id: string;
    position: string;
    status: string;
    song: {
      id: string;
      title: string;
      artist: string;
      difficulty: number;
    };
  }[];
  participatedMeetings: {
    id: string;
    attended: boolean;
    meeting: {
      id: string;
      title: string;
      date: string;
      status: string;
    };
  }[];
}

type TabType = "PROFILE" | "POINTS" | "ACTIVITIES";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("PROFILE");

  const [positions, setPositions] = useState<RankedPosition[]>(parsePositions(session?.user?.position));
  const [name, setName] = useState(session?.user?.name ?? "");
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  
  const [activities, setActivities] = useState<ActivityData | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setPositions(parsePositions(session.user.position));
      setName(session.user.name ?? "");
    }
  }, [session]);

  useEffect(() => {
    if (activeTab === "POINTS" && pointHistory.length === 0 && session?.user?.id) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`/api/members/${session.user.id}/points`);
          if (res.ok) setPointHistory(await res.json());
        } catch {
          // API might not exist yet
        }
      };
      fetchHistory();
    }
  }, [activeTab, session?.user?.id, pointHistory.length]);

  useEffect(() => {
    if (activeTab === "ACTIVITIES" && !activities && session?.user?.id) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const res = await fetch(`/api/members/${session.user.id}/activities`);
          if (res.ok) {
            const data = await res.json();
            setActivities(data);
          }
        } catch (error) {
          console.error("Failed to fetch activities:", error);
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    }
  }, [activeTab, session?.user?.id, activities]);

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-neutral-100 mb-8 animate-fade-in-up">👤 내 프로필</h1>

      {/* Profile Card Summary */}
      <div className="glass-card-static p-6 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="w-20 h-20 rounded-full border-2 border-forest-600"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-forest-700 flex items-center justify-center text-3xl border-2 border-forest-600 shadow-inner">
              {session.user.name?.[0]}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-neutral-100">{session.user.name}</h2>
            <p className="text-sm text-neutral-500 mb-2">{session.user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 items-center">
              <span className="text-sm font-semibold text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                ⭐ {session.user.points ?? 0}P
              </span>
              {session.user.role === "ADMIN" && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  관리자
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-forest-700/30 pb-2 animate-fade-in-up overflow-x-auto no-scrollbar" style={{ animationDelay: "0.2s" }}>
        {[
          { id: "PROFILE", label: "프로필 설정", icon: "⚙️" },
          { id: "ACTIVITIES", label: "나의 활동", icon: "🎸" },
          { id: "POINTS", label: "포인트 이력", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "text-emerald-400 border-b-2 border-emerald-400 bg-forest-900/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-forest-900/20"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        
        {/* Profile Settings */}
        {activeTab === "PROFILE" && (
          <div className="glass-card-static p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">이름 (닉네임)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">희망 포지션 (1~3순위 및 기타)</label>
              <PositionPicker value={positions} onChange={setPositions} />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-2.5 mt-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                saved
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-gradient-to-r from-emerald-500 to-forest-500 hover:from-emerald-400 hover:to-forest-400 text-white hover:shadow-lg hover:shadow-emerald-500/20"
              }`}
            >
              {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "프로필 저장"}
            </button>
          </div>
        )}

        {/* My Activities */}
        {activeTab === "ACTIVITIES" && (
          <div className="space-y-6">
            {loadingActivities ? (
              <div className="text-center py-10 text-neutral-400">데이터를 불러오는 중...</div>
            ) : activities ? (
              <>
                {/* 1. 내가 참여 신청한 곡 (세션) */}
                <div className="glass-card-static p-6">
                  <h3 className="text-lg font-bold text-neutral-100 mb-4 border-b border-forest-700/30 pb-2">
                    🎸 참여 신청한 세션 <span className="text-sm font-normal text-emerald-400 ml-2">{activities.appliedSessions.length}개</span>
                  </h3>
                  {activities.appliedSessions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.appliedSessions.map(session => (
                        <Link href={`/songs/${session.song.id}`} key={session.id} className="block group">
                          <div className="p-3 rounded-lg bg-forest-900/30 border border-forest-700/30 hover:border-emerald-500/40 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(session.position)}`}>
                                {getPositionLabel(session.position)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${session.status === 'FILLED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-500/15 text-neutral-400'}`}>
                                {session.status === 'FILLED' ? '모집완료' : '모집중'}
                              </span>
                            </div>
                            <h4 className="font-semibold text-neutral-200 group-hover:text-emerald-400 truncate">{session.song.title}</h4>
                            <p className="text-xs text-neutral-500 truncate">{session.song.artist}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm py-4">참여 신청한 세션이 없습니다.</p>
                  )}
                </div>

                {/* 2. 내가 등록한 곡 */}
                <div className="glass-card-static p-6">
                  <h3 className="text-lg font-bold text-neutral-100 mb-4 border-b border-forest-700/30 pb-2">
                    💿 내가 등록한 곡 <span className="text-sm font-normal text-emerald-400 ml-2">{activities.registeredSongs.length}개</span>
                  </h3>
                  {activities.registeredSongs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.registeredSongs.map(song => (
                        <Link href={`/songs/${song.id}`} key={song.id} className="block group">
                          <div className="p-3 rounded-lg bg-forest-900/30 border border-forest-700/30 hover:border-emerald-500/40 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-neutral-200 group-hover:text-emerald-400 truncate pr-2">{song.title}</h4>
                              <span className="text-xs text-gold-400 whitespace-nowrap">{"⭐".repeat(song.difficulty)}</span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                              <p className="text-xs text-neutral-500 truncate">{song.artist}</p>
                              <p className="text-[10px] text-neutral-600">{formatDate(song.createdAt)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm py-4">등록한 곡이 없습니다.</p>
                  )}
                </div>

                {/* 3. 내가 참여한 모임 */}
                <div className="glass-card-static p-6">
                  <h3 className="text-lg font-bold text-neutral-100 mb-4 border-b border-forest-700/30 pb-2">
                    🎪 참여한 모임 <span className="text-sm font-normal text-emerald-400 ml-2">{activities.participatedMeetings.length}개</span>
                  </h3>
                  {activities.participatedMeetings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.participatedMeetings.map(attendance => (
                        <Link href={`/meetings/${attendance.meeting.id}`} key={attendance.id} className="block group">
                          <div className="p-3 rounded-lg bg-forest-900/30 border border-forest-700/30 hover:border-emerald-500/40 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-neutral-200 group-hover:text-emerald-400 truncate">{attendance.meeting.title}</h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${attendance.attended ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-500/15 text-neutral-400'}`}>
                                {attendance.attended ? '참석완료' : '참석예정'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-2">{formatDate(attendance.meeting.date)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm py-4">참여한 모임이 없습니다.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Point History */}
        {activeTab === "POINTS" && (
          <div className="glass-card-static p-6">
            <h3 className="text-lg font-bold text-neutral-100 mb-4 border-b border-forest-700/30 pb-2">포인트 변동 내역</h3>
            {pointHistory.length > 0 ? (
              <div className="space-y-2">
                {pointHistory.map((ph) => (
                  <div key={ph.id} className="flex items-center justify-between p-3 rounded-lg bg-forest-900/30 border border-forest-700/20 hover:bg-forest-900/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-200 mb-0.5">{ph.reason}</p>
                      <p className="text-[11px] text-neutral-500">{formatDate(ph.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-bold ${ph.amount > 0 ? "text-emerald-400" : "text-danger-400"}`}>
                      {ph.amount > 0 ? "+" : ""}{ph.amount}P
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm text-center py-8">아직 포인트 이력이 없습니다.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
