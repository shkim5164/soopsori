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
      where: { songId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
        reactions: {
          include: { user: { select: { id: true, name: true, image: true } } }
        },
        replies: {
          include: { 
            user: { select: { id: true, name: true, image: true, role: true } },
            reactions: {
              include: { user: { select: { id: true, name: true, image: true } } }
            }
          },
          orderBy: { createdAt: "asc" },
        },
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
    const { content, parentId } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "내용을 입력하세요" }, { status: 400 });
    }

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return NextResponse.json({ error: "곡을 찾을 수 없습니다" }, { status: 404 });
    }

    const comment = await prisma.songComment.create({
      data: {
        content: content.trim(),
        songId,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    if (parentId) {
      const parentComment = await prisma.songComment.findUnique({ where: { id: parentId } });
      if (parentComment && parentComment.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: "COMMENT",
            message: `${session.user.name || "누군가"}님이 회원님의 댓글에 답글을 남겼습니다.`,
            linkUrl: `/songs/${songId}`,
          }
        });
      }
    } else if (song.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: song.userId,
          type: "COMMENT",
          message: `${session.user.name || "누군가"}님이 회원님의 곡 '${song.title}'에 댓글을 남겼습니다.`,
          linkUrl: `/songs/${songId}`,
        }
      });
    }

    // Process mentions
    const mentionMatches = content.match(/@([a-zA-Z0-9_가-힣]+)/g);
    if (mentionMatches && mentionMatches.length > 0) {
      const mentionedNames = Array.from(new Set(mentionMatches.map((m: string) => m.substring(1))));
      
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { in: mentionedNames } },
            { name: { in: mentionedNames } }
          ]
        },
        select: { id: true }
      });

      const notificationsData = mentionedUsers
        .filter(u => u.id !== session.user.id)
        .map(u => ({
          userId: u.id,
          type: "MENTION",
          message: `${session.user.name || "누군가"}님이 댓글에서 회원님을 언급했습니다.`,
          linkUrl: `/songs/${songId}`,
        }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData
        });
      }
    }

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

    // Process new mentions
    const oldMentions = comment.content.match(/@([a-zA-Z0-9_가-힣]+)/g) || [];
    const newMentions = content.match(/@([a-zA-Z0-9_가-힣]+)/g) || [];
    
    const oldMentionedNames = new Set(oldMentions.map(m => m.substring(1)));
    const newlyMentionedNames = Array.from(new Set(newMentions.map(m => m.substring(1))))
      .filter(name => !oldMentionedNames.has(name));

    if (newlyMentionedNames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { in: newlyMentionedNames } },
            { name: { in: newlyMentionedNames } }
          ]
        },
        select: { id: true }
      });

      const { id: songId } = await params;
      const notificationsData = mentionedUsers
        .filter(u => u.id !== session.user.id)
        .map(u => ({
          userId: u.id,
          type: "MENTION",
          message: `${session.user.name || "누군가"}님이 댓글을 수정하여 회원님을 언급했습니다.`,
          linkUrl: `/songs/${songId}`,
        }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData
        });
      }
    }

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
