import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/meetings/[id] - 모임 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        meetingSongs: {
          include: {
            song: {
              include: {
                sessions: {
                  include: { user: { select: { id: true, name: true, image: true } } },
                },
              },
            },
            picker: { select: { id: true, name: true, image: true, points: true } },
            participants: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
          orderBy: { orderNum: "asc" },
        },
        attendances: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to fetch meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
