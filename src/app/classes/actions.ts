"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClass(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const deadlineStr = formData.get("deadline") as string;
  const capacityStr = formData.get("capacity") as string;

  if (!title || !content || !deadlineStr || !capacityStr) {
    throw new Error("Missing fields");
  }

  const deadline = new Date(deadlineStr);
  const capacity = parseInt(capacityStr, 10);

  // 썸네일 파싱 (<img> 태그에서 src 속성 추출)
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  const thumbnail = match ? match[1] : null;

  const newClass = await prisma.class.create({
    data: {
      title,
      content,
      deadline,
      capacity,
      thumbnail,
      creatorId: session.user.id,
    },
  });

  revalidatePath("/classes");
  redirect(`/classes/${newClass.id}`);
}

export async function joinClass(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      participants: true,
    },
  });

  if (!targetClass) {
    throw new Error("Class not found");
  }

  if (targetClass.participants.length >= targetClass.capacity) {
    throw new Error("Capacity full");
  }

  const alreadyJoined = targetClass.participants.some(
    (p) => p.userId === session.user.id
  );

  if (alreadyJoined) {
    throw new Error("Already joined");
  }

  await prisma.classParticipant.create({
    data: {
      classId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");
}

export async function cancelJoinClass(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existingParticipant = await prisma.classParticipant.findUnique({
    where: {
      classId_userId: {
        classId,
        userId: session.user.id,
      },
    },
  });

  if (!existingParticipant) {
    throw new Error("Not joined");
  }

  await prisma.classParticipant.delete({
    where: {
      id: existingParticipant.id,
    },
  });

  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");
}

export async function updateClass(classId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!targetClass) {
    throw new Error("Class not found");
  }

  if (targetClass.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const deadlineStr = formData.get("deadline") as string;
  const capacityStr = formData.get("capacity") as string;

  if (!title || !content || !deadlineStr || !capacityStr) {
    throw new Error("Missing fields");
  }

  const deadline = new Date(deadlineStr);
  const capacity = parseInt(capacityStr, 10);

  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  const thumbnail = match ? match[1] : null;

  await prisma.class.update({
    where: { id: classId },
    data: {
      title,
      content,
      deadline,
      capacity,
      thumbnail,
    },
  });

  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");
  redirect(`/classes/${classId}`);
}

export async function deleteClass(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!targetClass) {
    throw new Error("Class not found");
  }

  if (targetClass.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await prisma.class.delete({
    where: { id: classId },
  });

  revalidatePath("/classes");
  redirect("/classes");
}

