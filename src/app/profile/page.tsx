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
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{name?: string, password?: string, general?: string}>({});

  const [activities, setActivities] = useState<ActivityData | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setPositions(parsePositions(session.user.position));
      setName(session.user.name ?? "");
      if (!imagePreview && session.user.image) setImagePreview(session.user.image);
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
    setFormErrors({});

    let uploadedImageUrl = undefined;
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedImageUrl = data.url;
        } else {
          setFormErrors({ general: "이미지 업로드에 실패했습니다." });
          setSaving(false);
          return;
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        setFormErrors({ general: "이미지 업로드 중 오류가 발생했습니다." });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/members/${session.user.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: stringifyPositions(positions),
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          image: uploadedImageUrl,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setImageFile(null);
        update();
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json();
        const msg = err.error || "수정에 실패했습니다.";
        if (msg.includes("닉네임")) {
          setFormErrors({ name: msg });
        } else if (msg.includes("비밀번호")) {
          setFormErrors({ password: msg });
        } else {
          setFormErrors({ general: msg });
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setFormErrors({ general: "서버 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">🔒</span>
        <h1 className="text-xl font-bold text-black font-bold">로그인이 필요합니다</h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-black font-black mb-8 animate-fade-in-up">👤 내 프로필</h1>

      {/* Profile Card Summary */}
      <div className="neo-card p-6 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {imagePreview || session.user.image ? (
            <img
              src={imagePreview || session.user.image || ""}
              alt={session.user.name ?? ""}
              className="w-20 h-20 rounded-full border-2 border-2 border-black object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-3xl border-2 border-2 border-black shadow-inner">
              {session.user.name?.[0]}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-black font-black">{session.user.name}</h2>
            <p className="text-sm text-gray-800 font-bold mb-2">{session.user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 items-center">
              <span className="text-sm font-semibold text-black font-black bg-neo-yellow px-1 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                ⭐ {session.user.points ?? 0}P
              </span>
              {session.user.role === "ADMIN" && (
                <span className="text-xs px-2 py-1 rounded-full neo-btn neo-btn-primary/15 text-neo-pink font-black border border-3 border-black">
                  관리자
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 animate-fade-in-up overflow-x-auto no-scrollbar" style={{ animationDelay: "0.2s" }}>
        {[
          { id: "PROFILE", label: "프로필 설정", icon: "⚙️" },
          { id: "ACTIVITIES", label: "나의 활동", icon: "🎸" },
          { id: "POINTS", label: "포인트 이력", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-sm transition-all whitespace-nowrap border-3 border-black neo-shadow ${
              activeTab === tab.id
                ? "bg-neo-yellow text-black translate-x-[2px] translate-y-[2px] neo-shadow-sm"
                : "bg-white text-black hover:bg-neo-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:neo-shadow-sm"
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
          <div className="neo-card p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">프로필 사진</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neo-yellow file:text-black hover:file:bg-neo-pink hover:file:text-white file:transition-colors cursor-pointer mb-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-1.5">이름 (닉네임)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 font-bold mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black font-bold mb-2">희망 포지션 (1~3순위 및 기타)</label>
              <PositionPicker value={positions} onChange={setPositions} />
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-bold text-black font-black mb-3">비밀번호 변경</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black font-bold mb-1">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="비밀번호를 변경하려면 입력하세요"
                    className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black font-bold mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새로운 비밀번호"
                    className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
                  />
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-500 font-bold mt-1">{formErrors.password}</p>
                )}
                {formErrors.general && (
                  <p className="text-sm text-red-500 font-bold mt-1">{formErrors.general}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-2.5 mt-2 rounded-none font-medium text-sm transition-all duration-200 ${
                saved
                  ? "neo-btn neo-btn-primary/20 text-neo-pink font-black border border-3 border-black"
                  : "neo-btn neo-btn-primary hover:neo-shadow-lg"
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
              <div className="text-center py-10 text-black font-bold">데이터를 불러오는 중...</div>
            ) : activities ? (
              <>
                {/* 1. 내가 참여 신청한 곡 (세션) */}
                <div className="neo-card p-6">
                  <h3 className="text-lg font-bold text-black font-black mb-4  pb-2">
                    🎸 참여 신청한 세션 <span className="text-sm font-normal text-neo-pink font-black ml-2">{activities.appliedSessions.length}개</span>
                  </h3>
                  {activities.appliedSessions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.appliedSessions.map(session => (
                        <Link href={`/songs/${session.song.id}`} key={session.id} className="block group">
                          <div className="p-3 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black hover:border-3 border-black transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(session.position)}`}>
                                {getPositionLabel(session.position)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${session.status === 'FILLED' ? 'neo-btn neo-btn-primary/15 text-neo-pink font-black' : 'bg-neutral-500/15 text-black font-bold'}`}>
                                {session.status === 'FILLED' ? '모집완료' : '모집중'}
                              </span>
                            </div>
                            <h4 className="font-semibold text-black font-black group-hover:text-neo-pink font-black truncate">{session.song.title}</h4>
                            <p className="text-xs text-gray-800 font-bold truncate">{session.song.artist}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-800 font-bold text-sm py-4">참여 신청한 세션이 없습니다.</p>
                  )}
                </div>

                {/* 2. 내가 등록한 곡 */}
                <div className="neo-card p-6">
                  <h3 className="text-lg font-bold text-black font-black mb-4  pb-2">
                    💿 내가 등록한 곡 <span className="text-sm font-normal text-neo-pink font-black ml-2">{activities.registeredSongs.length}개</span>
                  </h3>
                  {activities.registeredSongs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.registeredSongs.map(song => (
                        <Link href={`/songs/${song.id}`} key={song.id} className="block group">
                          <div className="p-3 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black hover:border-3 border-black transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-black font-black group-hover:text-neo-pink font-black truncate pr-2">{song.title}</h4>
                              <span className="text-xs text-black font-black bg-neo-yellow px-1 whitespace-nowrap">{"⭐".repeat(song.difficulty)}</span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                              <p className="text-xs text-gray-800 font-bold truncate">{song.artist}</p>
                              <p className="text-[10px] text-gray-800">{formatDate(song.createdAt)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-800 font-bold text-sm py-4">등록한 곡이 없습니다.</p>
                  )}
                </div>

                {/* 3. 내가 참여한 모임 */}
                <div className="neo-card p-6">
                  <h3 className="text-lg font-bold text-black font-black mb-4  pb-2">
                    🎪 참여한 모임 <span className="text-sm font-normal text-neo-pink font-black ml-2">{activities.participatedMeetings.length}개</span>
                  </h3>
                  {activities.participatedMeetings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.participatedMeetings.map(attendance => (
                        <Link href={`/meetings/${attendance.meeting.id}`} key={attendance.id} className="block group">
                          <div className="p-3 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black hover:border-3 border-black transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-black font-black group-hover:text-neo-pink font-black truncate">{attendance.meeting.title}</h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${attendance.attended ? 'neo-btn neo-btn-primary/15 text-neo-pink font-black' : 'bg-neutral-500/15 text-black font-bold'}`}>
                                {attendance.attended ? '참석완료' : '참석예정'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-800 font-bold mt-2">{formatDate(attendance.meeting.date)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-800 font-bold text-sm py-4">참여한 모임이 없습니다.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Point History */}
        {activeTab === "POINTS" && (
          <div className="neo-card p-6">
            <h3 className="text-lg font-bold text-black font-black mb-4  pb-2">포인트 변동 내역</h3>
            {pointHistory.length > 0 ? (
              <div className="space-y-2">
                {pointHistory.map((ph) => (
                  <div key={ph.id} className="flex items-center justify-between py-3 border-b-2 border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-black font-black mb-0.5">{ph.reason}</p>
                      <p className="text-[11px] text-gray-800 font-bold">{formatDate(ph.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-bold ${ph.amount > 0 ? "text-neo-pink font-black" : "text-danger-400"}`}>
                      {ph.amount > 0 ? "+" : ""}{ph.amount}P
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-800 font-bold text-sm text-center py-8">아직 포인트 이력이 없습니다.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
