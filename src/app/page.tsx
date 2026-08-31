import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { formatDate } from "@/lib/constants";

export default async function HomePage() {
  const session = await auth();

  // 다음 모임
  const nextMeeting = await prisma.meeting.findFirst({
    where: { status: "UPCOMING" },
    orderBy: { date: "asc" },
    include: {
      meetingSongs: {
        include: {
          song: true,
          picker: { select: { name: true, image: true } },
        },
        orderBy: { orderNum: "asc" },
      },
    },
  });

  // 최근 등록된 곡 (5개)
  const recentSongs = await prisma.song.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, image: true } },
      sessions: true,
    },
  });

  // 포인트 랭킹 (상위 5명)
  const topMembers = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    take: 5,
    orderBy: { points: "desc" },
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
      position: true,
    },
  });

  // 최신 공지 (3개)
  const recentNotices = await prisma.notice.findMany({
    take: 3,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16 mt-8 animate-fade-in-up">
        <h1 className="text-6xl sm:text-8xl font-black mb-6 uppercase tracking-tighter">
          <span className="bg-neo-yellow border-4 border-black px-6 py-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] inline-block transform -rotate-2">
            soopsori
          </span>
        </h1>
        <p className="text-black font-black text-2xl uppercase mt-8">
          get ready to rock 🤘
        </p>
        {!session && (
          <div className="mt-8">
            <Link href="/login" className="neo-btn neo-btn-primary text-xl px-8 py-4">
              JOIN THE CREW
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* 다음 모임 */}
        <div className="lg:col-span-2 neo-card p-6 animate-pulse-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-black flex items-center gap-2">
              📅 다음 모임
            </h2>
            <Link
              href="/meetings"
              className="text-sm text-neo-pink font-black hover:text-neo-pink font-black transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          {nextMeeting ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1.5 rounded-none neo-btn neo-btn-primary/15 border border-3 border-black">
                  <span className="text-neo-pink font-black font-semibold text-sm">
                    {formatDate(nextMeeting.date)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-black font-black">
                  {nextMeeting.title}
                </h3>
              </div>
              {nextMeeting.description && (
                <p className="text-black font-bold text-sm mb-4">
                  {nextMeeting.description}
                </p>
              )}
              {nextMeeting.meetingSongs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-800 font-bold uppercase tracking-wider">
                    세트리스트
                  </p>
                  {nextMeeting.meetingSongs.map((ms, i) => (
                    <div
                      key={ms.id}
                      className="flex items-center gap-3 p-2 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
                    >
                      <span className="text-sm font-mono text-gray-800 w-6 text-right">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black font-black truncate">
                          {ms.song.title}
                        </p>
                        <p className="text-xs text-gray-800 font-bold">{ms.song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ms.picker.image && (
                          <img
                            src={ms.picker.image}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span className="text-xs text-gray-800 font-bold">
                          {ms.picker.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-800 font-bold text-sm">
                  아직 등록된 곡이 없습니다. 곡을 추가해보세요!
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-800 font-bold">예정된 모임이 없습니다</p>
            </div>
          )}
        </div>

        {/* 포인트 랭킹 */}
        <div className="neo-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-black flex items-center gap-2">
              🏆 선곡 우선순위
            </h2>
            <Link
              href="/members"
              className="text-sm text-neo-pink font-black hover:text-neo-pink font-black transition-colors"
            >
              전체 →
            </Link>
          </div>
          <div className="space-y-3">
            {topMembers.map((member, i) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-none hover:bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              >
                <span
                  className={`text-lg w-7 text-center ${
                    i === 0
                      ? "text-black font-black bg-neo-yellow px-1"
                      : i === 1
                      ? "text-black font-bold"
                      : i === 2
                      ? "text-amber-700"
                      : "text-gray-800"
                  }`}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt=""
                      className="w-7 h-7 rounded-full border border-2 border-black"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neo-yellow border-2 border-black text-black flex items-center justify-center text-xs">
                      {member.name?.[0]}
                    </div>
                  )}
                  <span className="text-sm text-black font-black truncate">
                    {member.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-black font-black bg-neo-yellow px-1">
                  {member.points}P
                </span>
              </div>
            ))}
            {topMembers.length === 0 && (
              <p className="text-gray-800 font-bold text-sm text-center py-4">
                아직 회원이 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 최근 등록 곡 */}
        <div className="lg:col-span-2 neo-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-black flex items-center gap-2">
              🎵 최근 등록된 곡
            </h2>
            <Link
              href="/songs"
              className="text-sm text-neo-pink font-black hover:text-neo-pink font-black transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          {recentSongs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentSongs.map((song) => {
                const openSessions = song.sessions.filter(
                  (s) => s.status === "OPEN"
                ).length;
                const totalSessions = song.sessions.length;
                return (
                  <Link
                    key={song.id}
                    href={`/songs/${song.id}`}
                    className="flex items-start gap-3 p-3 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-2 border-black hover:border-2 border-black transition-all duration-200"
                  >
                    {song.youtubeUrl && (
                      <img
                        src={`https://img.youtube.com/vi/${song.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}/mqdefault.jpg`}
                        alt=""
                        className="w-20 h-14 object-cover rounded-none flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black font-black truncate">
                        {song.title}
                      </p>
                      <p className="text-xs text-gray-800 font-bold">{song.artist}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-800">
                          by {song.user.name}
                        </span>
                        {totalSessions > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              openSessions > 0
                                ? "neo-btn neo-btn-primary/15 text-neo-pink font-black"
                                : "bg-neo-yellow border-2 border-black text-black text-gray-800 font-bold"
                            }`}
                          >
                            {openSessions > 0
                              ? `세션 ${openSessions}자리`
                              : "세션 완료"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-800 font-bold text-sm text-center py-8">
              등록된 곡이 없습니다
            </p>
          )}
        </div>

        {/* 최신 공지 */}
        <div className="neo-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-black flex items-center gap-2">
              📢 공지사항
            </h2>
            <Link
              href="/notices"
              className="text-sm text-neo-pink font-black hover:text-neo-pink font-black transition-colors"
            >
              전체 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotices.map((notice) => (
              <div
                key={notice.id}
                className="p-3 rounded-none bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  {notice.pinned && <span className="text-xs">📌</span>}
                  <div>
                    <p className="text-sm font-medium text-black font-black">
                      {notice.title}
                    </p>
                    <p className="text-xs text-gray-800 font-bold mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                    <p className="text-xs text-gray-800 mt-1">
                      {notice.author.name} · {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentNotices.length === 0 && (
              <p className="text-gray-800 font-bold text-sm text-center py-4">
                공지사항이 없습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
