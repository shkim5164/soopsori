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

    const { name, address, description, latitude, longitude } = await req.json();

    if (!name || !address) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    let finalLat = latitude;
    let finalLng = longitude;

    // 만약 위도/경도가 명시적으로 안 넘어왔다면 (혹은 0이라면) 주소를 기반으로 API 호출
    if (!finalLat || !finalLng) {
      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || process.env.NAVER_MAP_CLIENT_ID;
      const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: "서버에 네이버 지도 API Client ID 또는 Secret이 설정되지 않았습니다. 관리자에게 문의하세요." }, { status: 500 });
      }

      const geocodeRes = await fetch(`https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
        headers: {
          "x-ncp-apigw-api-key-id": clientId,
          "x-ncp-apigw-api-key": clientSecret
        }
      });

      if (!geocodeRes.ok) {
        return NextResponse.json({ error: "주소 변환 API 호출에 실패했습니다." }, { status: 500 });
      }

      const data = await geocodeRes.json();
      if (data.addresses && data.addresses.length > 0) {
        finalLat = parseFloat(data.addresses[0].y); // 위도 (Latitude)
        finalLng = parseFloat(data.addresses[0].x); // 경도 (Longitude)
      } else {
        return NextResponse.json({ error: "해당 주소로 좌표를 찾을 수 없습니다. 정확한 도로명/지번 주소를 입력해주세요." }, { status: 400 });
      }
    }

    const newStudio = await prisma.studio.create({
      data: {
        name,
        address,
        latitude: finalLat,
        longitude: finalLng,
        description,
      },
    });

    return NextResponse.json(newStudio, { status: 201 });
  } catch (error) {
    console.error("Failed to create studio:", error);
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 });
  }
}
