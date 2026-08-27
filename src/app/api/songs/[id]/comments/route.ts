import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs/[id]/comments - 해당 곡의 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: songId } = await params;
    const comments = await prisma.songComment.findMany({
      where: { songId },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/songs/[id]/comments - 곡에 댓글 등록
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
    const { content } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });
    }

    const comment = await prisma.songComment.create({
      data: {
        content: content.trim(),
        songId,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/songs/[id]/comments - 곡 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다" }, { status: 400 });
    }

    const comment = await prisma.songComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
    }

    if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    await prisma.songComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH /api/songs/[id]/comments - 곡 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    
    if (!commentId) {
      return NextResponse.json({ error: "댓글 ID가 필요합니다" }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });
    }

    const comment = await prisma.songComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
    }

    if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const updatedComment = await prisma.songComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
