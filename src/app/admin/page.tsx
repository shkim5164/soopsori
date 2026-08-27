import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "어드민 - 숲소리",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminClient />;
}
