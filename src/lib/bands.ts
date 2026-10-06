import { prisma } from "@/lib/prisma";

export const bandInclude = {
  members: { include: { user: { select: { id: true, name: true } } }, orderBy: { id: "asc" as const } },
};

export async function parseBand(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const { name, members } = value as { name?: unknown; members?: unknown };
  if (typeof name !== "string" || !name.trim() || name.trim().length > 60 || !Array.isArray(members) || !members.length || members.length > 50) return null;
  const rows: { userId: string; position: string }[] = [];
  for (const member of members) {
    if (!member || typeof member.userId !== "string" || typeof member.position !== "string" || !member.position.trim() || member.position.trim().length > 50) return null;
    rows.push({ userId: member.userId, position: member.position.trim() });
  }
  if (new Set(rows.map(m => JSON.stringify([m.userId, m.position]))).size !== rows.length) return null;
  const ids = [...new Set(rows.map(m => m.userId))];
  if (await prisma.user.count({ where: { id: { in: ids } } }) !== ids.length) return null;
  return { name: name.trim(), members: rows };
}

export async function getBandSessions(bandId: string) {
  const band = await prisma.band.findUnique({ where: { id: bandId }, include: { members: true } });
  if (!band?.members.length) return null;
  return band.members.map(m => ({ position: m.position, userId: m.userId, status: "FILLED" }));
}
