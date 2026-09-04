import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/register - 회원가입
export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호는 필수입니다" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "아이디는 3자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    // 중복 확인
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다" },
        { status: 409 }
      );
    }

    const targetName = name || username;
    const existingName = await prisma.user.findFirst({
      where: { name: targetName },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임(이름)입니다" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 첫 번째 회원이면 관리자로 설정
    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: targetName,
        role: userCount === 0 ? "ADMIN" : "MEMBER",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: userCount === 0
          ? "관리자 계정으로 가입되었습니다!"
          : "가입이 완료되었습니다!",
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
