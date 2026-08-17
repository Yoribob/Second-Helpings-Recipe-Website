import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { serverGetJson } from "@/lib/server-api";
import type { ApiUser } from "@/lib/types";
import { AdminQueue } from "./AdminQueue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moderation",
};

async function fetchMe(): Promise<ApiUser | null> {
  try {
    const data = await serverGetJson<{ user: ApiUser }>("/api/user/me");
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session.hasToken) redirect("/login?next=/admin");

  const user = await fetchMe();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();

  return <AdminQueue />;
}