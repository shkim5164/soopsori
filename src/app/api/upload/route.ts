import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    console.log("[Upload API] 1. Starting auth check...");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[Upload API] 1. Auth failed.");
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    console.log("[Upload API] 2. Reading formData...");
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      console.log("[Upload API] 2. File is missing.");
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    console.log("[Upload API] 3. File received:", file.name, "Size:", file.size, "Type:", file.type);
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드 가능합니다" }, { status: 400 });
    }

    const fileName = `profiles/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

    console.log("[Upload API] 4. Calling @vercel/blob put...");
    const blob = await put(fileName, file, { 
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("[Upload API] 5. Upload success! URL:", blob.url);
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[Upload API] Error occurred:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
