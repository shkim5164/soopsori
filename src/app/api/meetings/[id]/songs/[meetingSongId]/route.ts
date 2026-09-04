import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingSongId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: meetingId, meetingSongId } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting || meeting.status !== "UPCOMING") {
      return NextResponse.json({ error: "곡을 삭제할 수 없는 모임입니다" }, { status: 400 });
    }

    const meetingSong = await prisma.meetingSong.findUnique({
      where: { id: meetingSongId },
    });

    if (!meetingSong) {
      return NextResponse.json({ error: "세트리스트에서 해당 곡을 찾을 수 없습니다" }, { status: 404 });
    }

    if (meetingSong.pickerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "곡을 추가한 사람이나 관리자만 삭제할 수 있습니다" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.meetingSong.delete({
        where: { id: meetingSongId },
      });

      // Reorder remaining songs
      const remainingSongs = await tx.meetingSong.findMany({
        where: { meetingId },
        orderBy: { orderNum: "asc" },
      });

      for (let i = 0; i < remainingSongs.length; i++) {
        if (remainingSongs[i].orderNum !== i + 1) {
          await tx.meetingSong.update({
            where: { id: remainingSongs[i].id },
            data: { orderNum: i + 1 },
          });
        }
      }
    });

    return NextResponse.json({ message: "곡이 삭제되었습니다" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete song from meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
