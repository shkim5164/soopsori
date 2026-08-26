import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/meetings - 모임 목록
export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        meetingSongs: {
          include: {
            song: { select: { id: true, title: true, artist: true } },
            picker: { select: { id: true, name: true, image: true } },
            participants: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
          orderBy: { orderNum: "asc" },
        },
        attendances: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/meetings - 모임 생성 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 모임을 생성할 수 있습니다" }, { status: 403 });
    }

    const { title, date, description } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: "모임 제목과 날짜는 필수입니다" }, { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: new Date(date),
        description: description || null,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
