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
    const song = await prisma.song.findUnique({ 
      where: { id },
      include: { sessions: true }
    });

    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    if (song.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { title, artist, youtubeUrl, description, difficulty, sessions: newSessions } = await request.json();
    if (!title || !artist) {
      return NextResponse.json({ error: "제목과 아티스트는 필수입니다" }, { status: 400 });
    }

    const parsedDifficulty = difficulty !== undefined ? parseInt(difficulty, 10) : undefined;
    const updateData: any = { title, artist, youtubeUrl, description };
    if (parsedDifficulty !== undefined && !isNaN(parsedDifficulty)) {
      updateData.difficulty = parsedDifficulty;
    }

    if (newSessions && Array.isArray(newSessions)) {
      const existingCounts: Record<string, number> = {};
      song.sessions.forEach(s => existingCounts[s.position] = (existingCounts[s.position] || 0) + 1);
      
      const newCounts: Record<string, number> = {};
      newSessions.forEach(p => newCounts[p] = (newCounts[p] || 0) + 1);

      const toDeleteIds: string[] = [];
      const toCreate: { position: string, status: "OPEN" }[] = [];

      const uniquePositions = new Set([...Object.keys(existingCounts), ...Object.keys(newCounts)]);
      for (const pos of uniquePositions) {
        const oldC = existingCounts[pos] || 0;
        const newC = newCounts[pos] || 0;
        
        if (newC > oldC) {
          for (let i = 0; i < newC - oldC; i++) toCreate.push({ position: pos, status: "OPEN" });
        } else if (newC < oldC) {
          const sessionsForPos = song.sessions.filter(s => s.position === pos);
          // Sort so that OPEN sessions are deleted first
          sessionsForPos.sort((a, b) => a.status === "OPEN" ? -1 : 1);
          
          for (let i = 0; i < oldC - newC; i++) {
            toDeleteIds.push(sessionsForPos[i].id);
          }
        }
      }

      updateData.sessions = {
        deleteMany: { id: { in: toDeleteIds } },
        create: toCreate
      };
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
