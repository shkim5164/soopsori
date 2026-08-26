import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/meetings/[id]/attendance - 출석 등록/변경
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: meetingId } = await params;
    const { userId, attended } = await request.json();

    // 관리자가 다른 사람의 출석을 변경하거나, 본인의 출석을 등록
    const targetUserId = userId || session.user.id;

    // 관리자가 아닌 경우 본인만 가능
    if (targetUserId !== session.user.id) {
      const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }
    }

    const attendance = await prisma.meetingAttendance.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId: targetUserId,
        },
      },
      update: { attended: attended ?? true },
      create: {
        meetingId,
        userId: targetUserId,
        attended: attended ?? true,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Failed to update attendance:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
