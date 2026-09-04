import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const studio = await prisma.studio.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    return NextResponse.json(studio);
  } catch (error) {
    console.error("Failed to fetch studio:", error);
    return NextResponse.json({ error: "Failed to fetch studio" }, { status: 500 });
  }
}
