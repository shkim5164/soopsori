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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (res.ok) setMembers(await res.json());
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-neutral-100">👥 회원 &amp; 선곡 우선순위</h1>
        <p className="text-neutral-500 mt-1">
          포인트가 높을수록 다음 모임의 선곡 우선순위가 높아집니다
        </p>
      </div>

      {/* Point System Info */}
      <div className="glass-card-static p-4 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">+</span>
            <div>
              <p className="text-neutral-300 font-medium">모임 참여</p>
              <p className="text-emerald-400 text-xs font-semibold">+100P</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-danger-500/10 flex items-center justify-center text-danger-400">−</span>
            <div>
              <p className="text-neutral-300 font-medium">선곡 차감</p>
              <p className="text-danger-400 text-xs font-semibold">−200P</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div>
                  <div className="skeleton h-5 w-24 mb-1" />
                  <div className="skeleton h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((member, i) => (
            <div key={member.id} className="glass-card p-5 relative overflow-hidden">
              {/* Rank Badge */}
              {i < 3 && (
                <div className="absolute top-3 right-3">
                  <span className="text-2xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className={`w-12 h-12 rounded-full border-2 ${
                      i === 0
                        ? "border-gold-400 shadow-lg shadow-gold-500/20"
                        : "border-forest-700"
                    }`}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-forest-700 flex items-center justify-center text-lg border-2 border-forest-600">
                    {member.name?.[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-100">{member.name}</h3>
                    {member.role === "ADMIN" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-400 border border-gold-500/20">
                        관리자
                      </span>
                    )}
                  </div>
                  {member.position && (
                    <div className="mt-1">
                      <PositionBadges positionStr={member.position} mode="full" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-forest-700/20">
                <div className="flex items-center gap-1.5">
                  <span className="text-gold-400 text-sm">⭐</span>
                  <span className="text-lg font-bold text-gold-400">{member.points}P</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>🎵 {member._count.songs}곡</span>
                  <span>📅 {member._count.meetingAttendances}회</span>
                </div>
              </div>

              {/* Rank indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5">
                <div
                  className={`h-full ${
                    i === 0
                      ? "bg-gradient-to-r from-gold-400 to-gold-500"
                      : i === 1
                      ? "bg-gradient-to-r from-neutral-400 to-neutral-500"
                      : i === 2
                      ? "bg-gradient-to-r from-amber-700 to-amber-800"
                      : "bg-transparent"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card-static">
          <span className="text-5xl mb-4 block">👥</span>
          <p className="text-neutral-400 text-lg">아직 회원이 없습니다</p>
        </div>
      )}
    </div>
  );
}
