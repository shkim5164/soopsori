import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    return NextResponse.json(await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }));
  } catch {
    return NextResponse.json({ error: "회원 목록을 불러오지 못했습니다" }, { status: 500 });
  }
}
