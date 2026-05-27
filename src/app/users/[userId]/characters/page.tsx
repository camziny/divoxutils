import { redirect } from "next/navigation";
import prisma from "../../../../../prisma/prismaClient";

interface LegacyCharactersPageProps {
  params: Promise<{ userId: string }>;
}

export default async function LegacyUserCharactersPage({ params }: LegacyCharactersPageProps) {
  const { userId } = await params;

  if (!userId) {
    redirect("/search");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { name: true },
  });

  if (user?.name) {
    redirect(`/user/${encodeURIComponent(user.name)}/characters`);
  }

  redirect("/search");
}
