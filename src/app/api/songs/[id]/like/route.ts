import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/songs/[id]/like - 곡 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: songId } = await params;
    const userId = session.user.id;

    // 해당 곡이 있는지 확인
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await prisma.songLike.findUnique({
      where: {
        songId_userId: {
          songId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 이미 눌렀다면 좋아요 취소 (삭제)
      await prisma.songLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ message: "좋아요 취소됨", liked: false });
    } else {
      // 안 눌렀다면 좋아요 생성
      await prisma.songLike.create({
        data: {
          songId,
          userId,
        },
      });

      // 알림 생성
      if (song.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: song.userId,
            type: "LIKE",
            message: `${session.user.name || "누군가"}님이 회원님의 곡 '${song.title}'을(를) 좋아합니다.`,
            linkUrl: `/songs/${songId}`,
          }
        });
      }

      return NextResponse.json({ message: "좋아요 완료", liked: true });
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
