import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/meetings/[id]/complete - 모임 완료 및 포인트 정산
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 확인
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자만 모임을 완료 처리할 수 있습니다" }, { status: 403 });
    }

    const { id: meetingId } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        attendances: true,
        meetingSongs: {
          include: {
            picker: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
    }

    if (meeting.status === "COMPLETED") {
      return NextResponse.json({ error: "이미 완료된 모임입니다" }, { status: 400 });
    }

    // 트랜잭션으로 포인트 정산
    await prisma.$transaction(async (tx) => {
      // 1. 모임 상태를 COMPLETED로 변경
      await tx.meeting.update({
        where: { id: meetingId },
        data: { status: "COMPLETED" },
      });

      // 2. 참석한 회원에게 +100 포인트
      const attendedUsers = meeting.attendances.filter((a) => a.attended);
      for (const attendance of attendedUsers) {
        await tx.user.update({
          where: { id: attendance.userId },
          data: { points: { increment: 100 } },
        });
        await tx.pointHistory.create({
          data: {
            userId: attendance.userId,
            amount: 100,
            reason: `모임 참여: ${meeting.title}`,
          },
        });
      }

      // 3. 선곡자에게 -200 포인트
      const pickerIds = [...new Set(meeting.meetingSongs.map((ms) => ms.pickerId))];
      for (const pickerId of pickerIds) {
        await tx.user.update({
          where: { id: pickerId },
          data: { points: { decrement: 200 } },
        });
        await tx.pointHistory.create({
          data: {
            userId: pickerId,
            amount: -200,
            reason: `선곡 차감: ${meeting.title}`,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: "모임이 완료 처리되었습니다" });
  } catch (error) {
    console.error("Failed to complete meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
