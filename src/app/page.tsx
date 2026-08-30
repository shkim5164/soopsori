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
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-emerald-400 via-forest-300 to-emerald-500 bg-clip-text text-transparent">
            🌲 숲소리
          </span>
        </h1>
        <p className="text-neutral-400 text-lg">
          함께 만드는 음악, 함께 나누는 즐거움
        </p>
        {!session && (
          <p className="mt-4 text-sm text-neutral-500">
            로그인하여 참여해보세요
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* 다음 모임 */}
        <div className="lg:col-span-2 glass-card p-6 animate-pulse-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              📅 다음 모임
            </h2>
            <Link
              href="/meetings"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
          {nextMeeting ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                  <span className="text-emerald-400 font-semibold text-sm">
                    {formatDate(nextMeeting.date)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-100">
                  {nextMeeting.title}
                </h3>
              </div>
              {nextMeeting.description && (
                <p className="text-neutral-400 text-sm mb-4">
                  {nextMeeting.description}
                </p>
              )}
              {nextMeeting.meetingSongs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">
                    세트리스트
                  </p>
                  {nextMeeting.meetingSongs.map((ms, i) => (
                    <div
                      key={ms.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-forest-900/30 hover:bg-forest-900/50 transition-colors"
                    >
                      <span className="text-sm font-mono text-neutral-600 w-6 text-right">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-200 truncate">
                          {ms.song.title}
                        </p>
                        <p className="text-xs text-neutral-500">{ms.song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ms.picker.image && (
                          <img
                            src={ms.picker.image}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span className="text-xs text-neutral-500">
                          {ms.picker.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">
                  아직 등록된 곡이 없습니다. 곡을 추가해보세요!
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">예정된 모임이 없습니다</p>
            </div>
          )}
        </div>

        {/* 포인트 랭킹 */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              🏆 선곡 우선순위
            </h2>
            <Link
              href="/members"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              전체 →
            </Link>
          </div>
          <div className="space-y-3">
            {topMembers.map((member, i) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-forest-900/30 transition-colors"
              >
                <span
                  className={`text-lg w-7 text-center ${
                    i === 0
                      ? "text-gold-400"
                      : i === 1
                      ? "text-neutral-400"
                      : i === 2
                      ? "text-amber-700"
                      : "text-neutral-600"
                  }`}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt=""
                      className="w-7 h-7 rounded-full border border-forest-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-xs">
                      {member.name?.[0]}
                    </div>
                  )}
                  <span className="text-sm text-neutral-200 truncate">
                    {member.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gold-400">
                  {member.points}P
                </span>
              </div>
            ))}
            {topMembers.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">
                아직 회원이 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 최근 등록 곡 */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              🎵 최근 등록된 곡
            </h2>
            <Link
              href="/songs"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
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
                    className="flex items-start gap-3 p-3 rounded-xl bg-forest-900/20 hover:bg-forest-900/40 border border-forest-700/10 hover:border-forest-700/30 transition-all duration-200"
                  >
                    {song.youtubeUrl && (
                      <img
                        src={`https://img.youtube.com/vi/${song.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}/mqdefault.jpg`}
                        alt=""
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {song.title}
                      </p>
                      <p className="text-xs text-neutral-500">{song.artist}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-600">
                          by {song.user.name}
                        </span>
                        {totalSessions > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              openSessions > 0
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-forest-700/30 text-neutral-500"
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
            <p className="text-neutral-500 text-sm text-center py-8">
              등록된 곡이 없습니다
            </p>
          )}
        </div>

        {/* 최신 공지 */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              📢 공지사항
            </h2>
            <Link
              href="/notices"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              전체 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotices.map((notice) => (
              <div
                key={notice.id}
                className="p-3 rounded-lg bg-forest-900/20 hover:bg-forest-900/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  {notice.pinned && <span className="text-xs">📌</span>}
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      {notice.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {notice.author.name} · {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentNotices.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">
                공지사항이 없습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
