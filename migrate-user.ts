import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.POSTGRES_URL_NON_POOLING?.split("?")[0];
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateUser(oldId: string, newId: string) {
  console.log(`Migrating data from ${oldId} to ${newId}...`);

  // Update Song
  await prisma.song.updateMany({ where: { userId: oldId }, data: { userId: newId } });
  
  // Update SongSession
  await prisma.songSession.updateMany({ where: { userId: oldId }, data: { userId: newId } });
  
  // Update Meeting
  await prisma.meeting.updateMany({ where: { creatorId: oldId }, data: { creatorId: newId } });
  
  // Update MeetingSong
  await prisma.meetingSong.updateMany({ where: { pickerId: oldId }, data: { pickerId: newId } });

  // Update PointHistory
  await prisma.pointHistory.updateMany({ where: { userId: oldId }, data: { userId: newId } });

  // Update Notice
  await prisma.notice.updateMany({ where: { authorId: oldId }, data: { authorId: newId } });

  // Update Notification
  await prisma.notification.updateMany({ where: { userId: oldId }, data: { userId: newId } });

  // Update SongComment
  await prisma.songComment.updateMany({ where: { userId: oldId }, data: { userId: newId } });

  // Handle MeetingParticipant (has unique [meetingSongId, userId])
  const mps = await prisma.meetingParticipant.findMany({ where: { userId: oldId } });
  for (const mp of mps) {
    const exists = await prisma.meetingParticipant.findUnique({ where: { meetingSongId_userId: { meetingSongId: mp.meetingSongId, userId: newId } } });
    if (exists) {
      await prisma.meetingParticipant.delete({ where: { id: mp.id } });
    } else {
      await prisma.meetingParticipant.update({ where: { id: mp.id }, data: { userId: newId } });
    }
  }

  // Handle MeetingAttendance (has unique [meetingId, userId])
  const mas = await prisma.meetingAttendance.findMany({ where: { userId: oldId } });
  for (const ma of mas) {
    const exists = await prisma.meetingAttendance.findUnique({ where: { meetingId_userId: { meetingId: ma.meetingId, userId: newId } } });
    if (exists) {
      await prisma.meetingAttendance.delete({ where: { id: ma.id } });
    } else {
      await prisma.meetingAttendance.update({ where: { id: ma.id }, data: { userId: newId } });
    }
  }

  // Handle SongLike (has unique [songId, userId])
  const sls = await prisma.songLike.findMany({ where: { userId: oldId } });
  for (const sl of sls) {
    const exists = await prisma.songLike.findUnique({ where: { songId_userId: { songId: sl.songId, userId: newId } } });
    if (exists) {
      await prisma.songLike.delete({ where: { id: sl.id } });
    } else {
      await prisma.songLike.update({ where: { id: sl.id }, data: { userId: newId } });
    }
  }

  // Handle CommentReaction (has unique [commentId, userId, emoji])
  const crs = await prisma.commentReaction.findMany({ where: { userId: oldId } });
  for (const cr of crs) {
    const exists = await prisma.commentReaction.findUnique({ where: { commentId_userId_emoji: { commentId: cr.commentId, userId: newId, emoji: cr.emoji } } });
    if (exists) {
      await prisma.commentReaction.delete({ where: { id: cr.id } });
    } else {
      await prisma.commentReaction.update({ where: { id: cr.id }, data: { userId: newId } });
    }
  }

  // Add the old user's points to the new user's points
  const oldUser = await prisma.user.findUnique({ where: { id: oldId } });
  if (oldUser && oldUser.points > 0) {
    await prisma.user.update({
      where: { id: newId },
      data: { points: { increment: oldUser.points } }
    });
  }

  // Delete the old user
  await prisma.user.delete({ where: { id: oldId } });
}

migrateUser('cmtb30g5800097gov8unx3s10', 'cmtmmu6y7000004l95a8ro5bb')
  .then(() => console.log('Migration complete'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
