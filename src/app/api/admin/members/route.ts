import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/members - 어드민용 회원 목록 조회 (관리자 권한 확인)
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const members = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        position: true,
        points: true,
        role: true,
        createdAt: true,
        songs: { select: { id: true, title: true } },
        songSessions: { select: { song: { select: { id: true, title: true } } } },
        meetingAttendances: { select: { meeting: { select: { id: true, title: true } } } },
        _count: {
          select: {
            songs: true,
            meetingAttendances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // 최신 가입순이나 이름순 등 적절히 정렬
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members for admin:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/admin/members - 어드민용 회원 생성
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, name, email, position, role } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "아이디와 비밀번호는 필수입니다." }, { status: 400 });
    }

    // 아이디 중복 확인
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        email: email || null,
        position: position || null,
        role: role || "MEMBER",
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        position: true,
        role: true,
        points: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
