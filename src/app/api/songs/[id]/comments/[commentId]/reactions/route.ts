import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/songs/[id]/comments/[commentId]/reactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id: songId, commentId } = await params;
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: "이모티콘이 필요합니다" }, { status: 400 });
    }

    const comment = await prisma.songComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.songId !== songId) {
      return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // 이미 리액션이 있으면 삭제 (토글)
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ message: "리액션이 취소되었습니다", added: false });
    } else {
      // 리액션 추가
      const newReaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId: session.user.id,
          emoji,
        },
      });

      // 댓글 작성자에게 알림 전송 (본인이 아닌 경우)
      if (comment.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: comment.userId,
            type: "REACTION",
            message: `${session.user.name}님이 회원님의 댓글에 ${emoji} 리액션을 남겼습니다.`,
            linkUrl: `/songs/${songId}#comment-${commentId}`,
          },
        });
      }

      return NextResponse.json({ message: "리액션이 추가되었습니다", added: true, reaction: newReaction }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
