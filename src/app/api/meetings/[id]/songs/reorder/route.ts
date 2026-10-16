import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const conflict = () => NextResponse.json(
  { error: "세트리스트가 변경되었습니다. 목록을 새로고침한 후 다시 시도해 주세요." },
  { status: 409 },
);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "관리자만 순서를 변경할 수 있습니다" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const validIds = (value: unknown): value is string[] => Array.isArray(value)
      && value.every(id => typeof id === "string" && id.length > 0)
      && new Set(value).size === value.length;
    if (!validIds(body?.songIds) || !validIds(body?.originalSongIds)
      || body.songIds.length !== body.originalSongIds.length
      || body.songIds.some((id: string) => !body.originalSongIds.includes(id))) {
      return NextResponse.json({ error: "전체 곡의 순서를 중복 없이 보내 주세요" }, { status: 400 });
    }
    const { id: meetingId } = await params;
    return await prisma.$transaction(async tx => {
      const meeting = await tx.meeting.findUnique({
        where: { id: meetingId },
        include: { meetingSongs: { orderBy: [{ orderNum: "asc" }, { id: "asc" }], select: { id: true } } },
      });
      if (!meeting) return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
      if (meeting.status !== "UPCOMING") return NextResponse.json({ error: "예정된 모임만 순서를 변경할 수 있습니다" }, { status: 400 });
      if (meeting.meetingSongs.length !== body.originalSongIds.length
        || meeting.meetingSongs.some((song, index) => song.id !== body.originalSongIds[index])) return conflict();

      for (const [index, id] of (body.songIds as string[]).entries()) {
        await tx.meetingSong.update({ where: { id, meetingId }, data: { orderNum: index + 1 } });
      }
      return NextResponse.json({ songIds: body.songIds });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return conflict();
    console.error("Failed to reorder meeting songs:", error);
    return NextResponse.json({ error: "순서를 저장하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
