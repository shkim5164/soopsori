import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notices/[id] - 공지 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const notice = await prisma.notice.findUnique({ where: { id } });

    if (!notice) {
      return NextResponse.json({ error: "공지를 찾을 수 없습니다" }, { status: 404 });
    }

    if (notice.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { title, content, pinned } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용은 필수입니다" }, { status: 400 });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: { 
        title, 
        content,
        ...(pinned !== undefined && { pinned })
      },
    });

    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error("Failed to update notice:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/notices/[id] - 공지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const notice = await prisma.notice.findUnique({ where: { id } });

    if (!notice) {
      return NextResponse.json({ error: "공지를 찾을 수 없습니다" }, { status: 404 });
    }

    if (notice.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    await prisma.notice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notice:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
