import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/members/[id]/points - 회원 포인트 관리자 직접 수정
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { points, reason } = body;

    if (typeof points !== "number") {
      return NextResponse.json({ error: "유효하지 않은 포인트 값입니다." }, { status: 400 });
    }

    // 현재 사용자 정보 조회하여 차이 계산
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const diff = points - user.points;
    const historyReason = reason || "관리자 직접 수정";

    // 트랜잭션으로 포인트 수정 및 히스토리 기록
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { points },
      });

      if (diff !== 0) {
        await tx.pointHistory.create({
          data: {
            userId: id,
            amount: diff,
            reason: historyReason,
          },
        });
      }

      return u;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update points:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
