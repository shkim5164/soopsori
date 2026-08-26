import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/members/[id]/points - 포인트 이력 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const history = await prisma.pointHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch point history:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
