import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bandInclude, parseBand } from "@/lib/bands";

export async function GET() {
  try {
    return NextResponse.json(await prisma.band.findMany({ include: bandInclude, orderBy: { name: "asc" } }));
  } catch {
    return NextResponse.json({ error: "밴드 목록을 불러오지 못했습니다" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const data = await parseBand(await request.json());
    if (!data) return NextResponse.json({ error: "밴드 이름과 회원별 포지션을 확인해주세요. 동일 회원의 같은 포지션은 중복 등록할 수 없습니다." }, { status: 400 });
    const band = await prisma.band.create({ data: { name: data.name, creatorId: session.user.id, members: { create: data.members } }, include: bandInclude });
    return NextResponse.json(band, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    return NextResponse.json({ error: duplicate ? "이미 등록된 밴드 이름입니다" : "밴드 등록에 실패했습니다" }, { status: duplicate ? 409 : 500 });
  }
}
