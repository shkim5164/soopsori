import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/members - 회원 목록 (포인트 랭킹)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const whereClause: any = {
      role: { not: "ADMIN" },
    };

    if (q) {
      whereClause.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        position: true,
        points: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            songs: true,
            meetingAttendances: true,
          },
        },
      },
      orderBy: { points: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
