import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PUT /api/admin/members/[id] - 어드민용 회원 정보 수정
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, position, role, password } = body;

    const dataToUpdate: any = {
      name: name || null,
      email: email || null,
      position: position || null,
      role: role || "MEMBER",
    };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/admin/members/[id] - 어드민용 회원 삭제
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;

    // 자기 자신은 삭제 불가 처리
    if (session.user.id === id) {
      return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete member:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
