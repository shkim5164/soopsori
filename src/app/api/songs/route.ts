import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getBandSessions } from "@/lib/bands";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs - 곡 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const sort = searchParams.get("sort") || "latest"; // "latest" | "popular"
    const difficultyParam = searchParams.get("difficulty");
    const difficulty = difficultyParam ? parseInt(difficultyParam) : undefined;
    const position = searchParams.get("position");
    const bandId = searchParams.get("bandId");

    const session = await auth();
    const currentUserId = session?.user?.id;

    // 정렬 기준 설정
    const orderBy = sort === "popular" 
      ? { likes: { _count: "desc" as const } } 
      : sort === "comments"
        ? { comments: { _count: "desc" as const } }
        : { createdAt: "desc" as const };

    const whereClause: Prisma.SongWhereInput = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
        { band: { is: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }
    if (bandId) {
      whereClause.bandId = bandId === "none" ? null : bandId === "any" ? { not: null } : bandId;
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
        band: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, image: true } },
        sessions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
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
    const { title, artist, youtubeUrl, description, sessions: sessionPositions, difficulty, bandId } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: "곡 제목과 아티스트는 필수입니다" }, { status: 400 });
    }

    if (bandId != null && typeof bandId !== "string") return NextResponse.json({ error: "밴드를 확인해주세요" }, { status: 400 });
    const bandSessions = bandId ? await getBandSessions(bandId) : null;
    if (bandId && !bandSessions) return NextResponse.json({ error: "구성원이 있는 밴드를 선택해주세요" }, { status: 400 });

    const parsedDifficulty = difficulty !== undefined ? parseInt(difficulty, 10) : 3;

    const song = await prisma.song.create({
      data: {
        bandId: bandId || null,
        title,
        artist,
        youtubeUrl: youtubeUrl || null,
        description: description || null,
        difficulty: isNaN(parsedDifficulty) ? 3 : parsedDifficulty,
        userId: session.user.id,
        sessions: {
          create: bandSessions ?? (sessionPositions || []).map((session: any) => {
            const position = typeof session === "string" ? session : session.position;
            const description = typeof session === "string" ? null : session.description;
            return {
              position,
              description: description || null,
              status: "OPEN",
            };
          }),
        },
      },
      include: {
        band: { select: { id: true, name: true } },
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
