import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import EditClassForm from "./EditClassForm";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const classItem = await prisma.class.findUnique({
    where: { id },
  });

  if (!classItem) {
    notFound();
  }

  const isCreator = classItem.creatorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isCreator && !isAdmin) {
    redirect(`/classes/${id}`);
  }

  return <EditClassForm classItem={classItem} />;
}
