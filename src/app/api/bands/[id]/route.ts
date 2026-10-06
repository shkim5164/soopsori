import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bandInclude, parseBand } from "@/lib/bands";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const { id } = await params;
    const band = await prisma.band.findUnique({ where: { id } });
    if (!band) return NextResponse.json({ error: "밴드를 찾을 수 없습니다" }, { status: 404 });
    if (band.creatorId !== session.user.id && session.user.role !== "ADMIN") return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const data = await parseBand(await request.json());
    if (!data) return NextResponse.json({ error: "밴드 이름과 회원별 포지션을 확인해주세요" }, { status: 400 });
    return NextResponse.json(await prisma.band.update({ where: { id }, data: { name: data.name, members: { deleteMany: {}, create: data.members } }, include: bandInclude }));
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    return NextResponse.json({ error: duplicate ? "이미 등록된 밴드 이름입니다" : "밴드 수정에 실패했습니다" }, { status: duplicate ? 409 : 500 });
  }
}
