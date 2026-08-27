import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs - 곡 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "latest"; // "latest" | "popular"
    const difficultyParam = searchParams.get("difficulty");
    const difficulty = difficultyParam ? parseInt(difficultyParam) : undefined;
    const position = searchParams.get("position");

    const session = await auth();
    const currentUserId = session?.user?.id;

    // 정렬 기준 설정
    const orderBy = sort === "popular" 
      ? { likes: { _count: "desc" as const } } 
      : { createdAt: "desc" as const };

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { artist: { contains: search } },
      ];
    }
    if (difficulty !== undefined && !isNaN(difficulty)) {
      whereClause.difficulty = difficulty;
    }
    if (position) {
      whereClause.sessions = {
        some: {
          position: position,
        }
      };
    }

    const songs = await prisma.song.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        user: { select: { id: true, name: true, image: true } },
        sessions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          select: { likes: true },
        },
        // 현재 유저가 좋아요 했는지 여부를 위해 likes 포함 (userId가 있을 때만 필터링)
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { userId: true },
        } : false,
      },
      orderBy,
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
    const { title, artist, youtubeUrl, description, sessions: sessionPositions, difficulty } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: "곡 제목과 아티스트는 필수입니다" }, { status: 400 });
    }

    const parsedDifficulty = difficulty !== undefined ? parseInt(difficulty, 10) : 3;

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        youtubeUrl: youtubeUrl || null,
        description: description || null,
        difficulty: isNaN(parsedDifficulty) ? 3 : parsedDifficulty,
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
