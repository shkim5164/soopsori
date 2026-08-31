"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import { formatDate, formatDateTime } from "@/lib/constants";
import Link from "next/link";

interface MeetingSong {
  id: string;
  orderNum: number;
  song: { id: string; title: string; artist: string };
  picker: { id: string; name: string; image: string };
  participants: { id: string; position: string; user: { id: string; name: string; image: string } }[];
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string | null;
  status: string;
  meetingSongs: MeetingSong[];
  attendances: { id: string; attended: boolean; user: { id: string; name: string; image: string } }[];
}

export default function MeetingsPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: "", date: "", description: "" });

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      setMeetings(data);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMeeting,
          date: new Date(newMeeting.date).toISOString(),
        }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewMeeting({ title: "", date: "", description: "" });
        fetchMeetings();
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
    }
  };

  const upcomingMeetings = meetings.filter((m) => m.status === "UPCOMING");
  const pastMeetings = meetings.filter((m) => m.status !== "UPCOMING");
  const displayedMeetings = tab === "upcoming" ? upcomingMeetings : pastMeetings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-black font-black">📅 모임</h1>
          <p className="text-gray-800 font-bold mt-1">매달 합주 모임을 관리합니다</p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            + 모임 만들기
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-none bg-white w-fit animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-none text-sm font-medium transition-all duration-200 ${
              tab === t
                ? "neo-btn text-neo-pink font-black shadow"
                : "text-gray-800 font-bold hover:text-black font-bold"
            }`}
          >
            {t === "upcoming" ? "예정된 모임" : "지난 모임"}
            <span className="ml-1.5 text-xs opacity-60">
              ({t === "upcoming" ? upcomingMeetings.length : pastMeetings.length})
            </span>
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="neo-card p-6">
              <div className="skeleton h-6 w-48 mb-3" />
              <div className="skeleton h-4 w-32 mb-4" />
              <div className="skeleton h-20 w-full" />
            </div>
          ))}
        </div>
      ) : displayedMeetings.length > 0 ? (
        <div className="space-y-4 stagger-children">
          {displayedMeetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/meetings/${meeting.id}`}
              className="block neo-card p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-black font-black">
                      {meeting.title}
                    </h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        meeting.status === "UPCOMING"
                          ? "neo-btn neo-btn-primary/15 text-neo-pink font-black"
                          : meeting.status === "COMPLETED"
                          ? "bg-neo-yellow border-2 border-black text-black text-gray-800 font-bold"
                          : "bg-danger-500/15 text-danger-400"
                      }`}
                    >
                      {meeting.status === "UPCOMING"
                        ? "예정"
                        : meeting.status === "COMPLETED"
                        ? "완료"
                        : "취소"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-bold mt-1">
                    {formatDateTime(meeting.date)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-800 font-bold">
                  <span>🎵 {meeting.meetingSongs.length}곡</span>
                  <span>
                    👥 {meeting.attendances.filter((a) => a.attended).length}명 참석
                  </span>
                </div>
              </div>

              {meeting.description && (
                <p className="text-sm text-black font-bold mb-4">{meeting.description}</p>
              )}

              {/* Song Preview */}
              {meeting.meetingSongs.length > 0 && (
                <div className="space-y-2">
                  {meeting.meetingSongs.slice(0, 3).map((ms, i) => (
                    <div
                      key={ms.id}
                      className="flex items-center gap-3 p-2 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="text-xs font-mono text-gray-800 w-5 text-right">
                        {ms.orderNum}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-black font-black truncate block">
                          {ms.song.title}
                        </span>
                        <span className="text-xs text-gray-800 font-bold">{ms.song.artist}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {ms.picker.image && (
                          <img src={ms.picker.image} alt="" className="w-5 h-5 rounded-full" />
                        )}
                        <span className="text-xs text-gray-800 font-bold">{ms.picker.name}</span>
                      </div>
                    </div>
                  ))}
                  {meeting.meetingSongs.length > 3 && (
                    <p className="text-xs text-gray-800 text-center">
                      +{meeting.meetingSongs.length - 3}곡 더보기
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 neo-card">
          <span className="text-5xl mb-4 block">📅</span>
          <p className="text-black font-bold text-lg">
            {tab === "upcoming" ? "예정된 모임이 없습니다" : "지난 모임이 없습니다"}
          </p>
        </div>
      )}

      {/* Create Meeting Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="모임 만들기">
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">모임 제목 *</label>
            <input
              type="text"
              required
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors"
              placeholder="예: 8월 정기 합주"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">날짜 *</label>
            <input
              type="datetime-local"
              required
              value={newMeeting.date}
              onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black focus:outline-none focus:border-3 border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black font-bold mb-1.5">설명</label>
            <textarea
              value={newMeeting.description}
              onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black transition-colors resize-none"
              placeholder="모임에 대한 설명"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-bold hover:text-black font-black hover:bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors font-medium text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-none neo-btn neo-btn-primary font-medium text-sm transition-all duration-200"
            >
              만들기
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
