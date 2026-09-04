import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { rating, content, images } = await req.json();

    if (!rating || !content) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const review = await prisma.studioReview.create({
      data: {
        rating: Number(rating),
        content,
        images: images || [],
        studioId: id,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
