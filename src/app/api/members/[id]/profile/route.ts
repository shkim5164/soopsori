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

    const { position, name, currentPassword, newPassword, image } = await request.json();

    if (name) {
      const existingName = await prisma.user.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });
      if (existingName) {
        return NextResponse.json({ error: "이미 사용 중인 닉네임(이름)입니다." }, { status: 400 });
      }
    }

    let passwordHash: string | undefined = undefined;

    // 비밀번호 변경 요청이 있는 경우
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "현재 비밀번호를 입력해주세요" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
      }

      // 관리자가 다른 유저의 비밀번호를 강제 변경하는 경우에는 currentPassword 확인 생략할 수 있으나, 
      // 마이페이지 기능이므로 본인이 직접 변경하는 상황으로 가정하고 currentPassword 검증
      const bcrypt = require("bcryptjs");
      const isValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValid && session.user.role !== "ADMIN") { // 관리자 예외 처리(옵션)
        return NextResponse.json({ error: "현재 비밀번호가 일치하지 않습니다" }, { status: 400 });
      }

      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(position !== undefined && { position }),
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(passwordHash !== undefined && { password: passwordHash }),
      },
      select: {
        id: true,
        name: true,
        position: true,
        points: true,
        role: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
