import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/members/[id]/profile - 프로필 수정
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

    // 본인이거나 관리자만 수정 가능
    if (id !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { position, name } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(position !== undefined && { position }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        name: true,
        position: true,
        points: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
