import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/meetings/[id]/songs - 모임에 곡 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { songId } = await request.json();

    // 모임 존재 확인
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.status !== "UPCOMING") {
      return NextResponse.json({ error: "곡을 추가할 수 없는 모임입니다" }, { status: 400 });
    }

    // 곡 존재 확인
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    // 이미 추가된 곡인지 확인
    const existing = await prisma.meetingSong.findFirst({
      where: { meetingId, songId },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 추가된 곡입니다" }, { status: 400 });
    }

    // 현재 곡 수로 순서 결정
    const songCount = await prisma.meetingSong.count({ where: { meetingId } });

    const meetingSong = await prisma.meetingSong.create({
      data: {
        meetingId,
        songId,
        pickerId: session.user.id,
        orderNum: songCount + 1,
      },
      include: {
        song: { select: { id: true, title: true, artist: true } },
        picker: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(meetingSong, { status: 201 });
  } catch (error) {
    console.error("Failed to add song to meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
