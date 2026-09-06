import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const existingStudio = await prisma.studio.findUnique({ where: { id } });
    if (!existingStudio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    if (existingStudio.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address, description, latitude, longitude } = await req.json();

    if (!name || !address) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    let finalLat = latitude;
    let finalLng = longitude;

    // 만약 주소가 변경되었거나 위도/경도가 없으면 지오코딩 다시 호출
    if (!finalLat || !finalLng) {
      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || process.env.NAVER_MAP_CLIENT_ID;
      const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET || process.env.NAVER_MAP_SECRET_ID;

      if (clientId && clientSecret) {
        const geocodeRes = await fetch(`https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
          headers: {
            "x-ncp-apigw-api-key-id": clientId,
            "x-ncp-apigw-api-key": clientSecret
          }
        });
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data.addresses && data.addresses.length > 0) {
            finalLat = parseFloat(data.addresses[0].y);
            finalLng = parseFloat(data.addresses[0].x);
          }
        }
      }
    }

    const updatedStudio = await prisma.studio.update({
      where: { id },
      data: {
        name,
        address,
        description,
        ...(finalLat && finalLng ? { latitude: finalLat, longitude: finalLng } : {}),
      },
    });

    return NextResponse.json(updatedStudio);
  } catch (error) {
    console.error("Failed to update studio:", error);
    return NextResponse.json({ error: "Failed to update studio" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingStudio = await prisma.studio.findUnique({ where: { id } });
    if (!existingStudio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    if (existingStudio.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.studio.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete studio:", error);
    return NextResponse.json({ error: "Failed to delete studio" }, { status: 500 });
  }
}
