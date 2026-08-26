import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs - 곡 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const songs = await prisma.song.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { artist: { contains: search } },
            ],
          }
        : undefined,
      include: {
        user: { select: { id: true, name: true, image: true } },
        sessions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/songs - 곡 등록
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await request.json();
    const { title, artist, youtubeUrl, description, sessions: sessionPositions } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: "곡 제목과 아티스트는 필수입니다" }, { status: 400 });
    }

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        youtubeUrl: youtubeUrl || null,
        description: description || null,
        userId: session.user.id,
        sessions: {
          create: (sessionPositions || []).map((position: string) => ({
            position,
            status: "OPEN",
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        sessions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error("Failed to create song:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
