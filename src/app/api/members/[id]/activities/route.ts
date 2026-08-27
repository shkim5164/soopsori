import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/members/[id]/activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    // 본인이거나 관리자만 열람 가능
    if (id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 1. 등록한 곡
    const registeredSongs = await prisma.song.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        artist: true,
        createdAt: true,
        difficulty: true,
      }
    });

    // 2. 참여 신청한 세션(곡 정보 포함)
    const appliedSessions = await prisma.songSession.findMany({
      where: { userId: id },
      orderBy: { song: { createdAt: "desc" } },
      select: {
        id: true,
        position: true,
        status: true,
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            difficulty: true,
          }
        }
      }
    });

    // 3. 참여한 모임 (MeetingAttendance 또는 MeetingParticipant 기준)
    // 참석 완료된 모임뿐만 아니라 참여 신청한 모임(MeetingAttendance)을 모두 가져옵니다.
    const participatedMeetings = await prisma.meetingAttendance.findMany({
      where: { userId: id },
      orderBy: { meeting: { date: "desc" } },
      select: {
        id: true,
        attended: true,
        meeting: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
          }
        }
      }
    });

    return NextResponse.json({
      registeredSongs,
      appliedSessions,
      participatedMeetings,
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
