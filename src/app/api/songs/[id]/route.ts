import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs/[id] - 곡 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, position: true } },
        sessions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error("Failed to fetch song:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/songs/[id] - 곡 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const song = await prisma.song.findUnique({ where: { id } });

    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    if (song.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    await prisma.song.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete song:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH /api/songs/[id] - 곡 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const song = await prisma.song.findUnique({ where: { id } });

    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    if (song.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { title, artist, youtubeUrl, description, difficulty } = await request.json();
    if (!title || !artist) {
      return NextResponse.json({ error: "제목과 아티스트는 필수입니다" }, { status: 400 });
    }

    const parsedDifficulty = difficulty !== undefined ? parseInt(difficulty, 10) : undefined;
    const updateData: any = { title, artist, youtubeUrl, description };
    if (parsedDifficulty !== undefined && !isNaN(parsedDifficulty)) {
      updateData.difficulty = parsedDifficulty;
    }

    const updatedSong = await prisma.song.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error("Failed to update song:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
