import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const studios = await prisma.studio.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(studios);
  } catch (error) {
    console.error("Failed to fetch studios:", error);
    return NextResponse.json({ error: "Failed to fetch studios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, address, latitude, longitude, description } = await req.json();

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const newStudio = await prisma.studio.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        description,
      },
    });

    return NextResponse.json(newStudio, { status: 201 });
  } catch (error) {
    console.error("Failed to create studio:", error);
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 });
  }
}
