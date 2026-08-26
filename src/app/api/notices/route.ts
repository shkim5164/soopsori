import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notices - 공지 목록
export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error("Failed to fetch notices:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/notices - 공지 작성 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 공지를 작성할 수 있습니다" }, { status: 403 });
    }

    const { title, content, pinned } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용은 필수입니다" }, { status: 400 });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        pinned: pinned ?? false,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("Failed to create notice:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
