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

// PATCH /api/meetings/[id] - 모임 수정
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
    const meeting = await prisma.meeting.findUnique({ where: { id } });

    if (!meeting) {
      return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
    }

    if (meeting.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { title, date, description, status } = await request.json();
    if (!title || !date) {
      return NextResponse.json({ error: "모임 제목과 날짜는 필수입니다" }, { status: 400 });
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: { 
        title, 
        date: new Date(date), 
        description,
        ...(status && { status })
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Failed to update meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/meetings/[id] - 모임 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({ where: { id } });

    if (!meeting) {
      return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
    }

    if (meeting.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    await prisma.meeting.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
