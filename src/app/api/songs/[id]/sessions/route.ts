import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/songs/[id]/sessions - 세션 참여 신청
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: songId } = await params;
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "세션 ID가 필요합니다" }, { status: 400 });
    }

    const songSession = await prisma.songSession.findUnique({
      where: { id: sessionId },
    });

    if (!songSession || songSession.songId !== songId) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    if (songSession.status === "FILLED") {
      return NextResponse.json({ error: "이미 충원된 세션입니다" }, { status: 400 });
    }

    const updated = await prisma.songSession.update({
      where: { id: sessionId },
      data: {
        userId: session.user.id,
        status: "FILLED",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to join session:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/songs/[id]/sessions - 세션 참여 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: songId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "세션 ID가 필요합니다" }, { status: 400 });
    }

    const songSession = await prisma.songSession.findUnique({
      where: { id: sessionId },
    });

    if (!songSession || songSession.songId !== songId) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    if (songSession.userId !== session.user.id) {
      return NextResponse.json({ error: "본인만 취소할 수 있습니다" }, { status: 403 });
    }

    const updated = await prisma.songSession.update({
      where: { id: sessionId },
      data: {
        userId: null,
        status: "OPEN",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to leave session:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
