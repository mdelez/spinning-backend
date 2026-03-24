import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js"; // adjust path

export async function triggerNextWaitlistUser(
    rideId: string,
    tx: Prisma.TransactionClient = prisma
) {
    const now = new Date();

    // check active reservation
    const active = await tx.waitlistEntry.findFirst({
        where: {
            rideId,
            status: "NOTIFIED",
            reservedUntil: { gt: now },
        },
    });

    if (active) return;

    // get next user
    const next = await tx.waitlistEntry.findFirst({
        where: {
            rideId,
            status: "WAITING",
        },
        orderBy: { createdAt: "asc" },
    });

    if (!next) return;

    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    console.log('next user: ', next.userId);
    console.log('reserved until: ', reservedUntil);

    // update entry
    await tx.waitlistEntry.update({
        where: { id: next.id },
        data: {
            status: "NOTIFIED",
            reservedUntil,
            notifiedAt: now,
        },
    });

    // notify next user
    //   await notifyUser(next.userId, {
    //     title: "Your spot is ready 🚴",
    //     body: "You have 15 minutes to book it",
    //   });
}