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

    const { name, address, description } = await req.json();

    if (!name || !address) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    let latitude = 0;
    let longitude = 0;

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || process.env.NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET || process.env.NAVER_MAP_CLIENT_SECRET || process.env.NAVER_MAP_SECRET_ID;

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
          latitude = parseFloat(data.addresses[0].y);
          longitude = parseFloat(data.addresses[0].x);
        } else {
          return NextResponse.json({ error: "해당 주소로 좌표를 찾을 수 없습니다. 정확한 도로명/지번 주소를 입력해주세요." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: `주소 변환 API 호출에 실패했습니다. (상태: ${geocodeRes.status})` }, { status: 500 });
      }
    }

    const newStudio = await prisma.studio.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        description,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(newStudio, { status: 201 });
  } catch (error) {
    console.error("Failed to create studio:", error);
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 });
  }
}
