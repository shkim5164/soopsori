import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/members - 어드민용 회원 목록 조회 (관리자 권한 확인)
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const members = await prisma.user.findMany({
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
      orderBy: { createdAt: "desc" }, // 최신 가입순이나 이름순 등 적절히 정렬
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members for admin:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
