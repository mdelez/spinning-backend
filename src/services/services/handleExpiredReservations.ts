import { prisma } from "../../prisma.js";
import { triggerNextWaitlistUser } from "./triggerNextWaitlistUser.js";

export async function handleExpiredReservations() {
    const now = new Date();
    console.log('handling expired reservations');

    try {
        // find expired reservations
        const expired = await prisma.waitlistEntry.findMany({
            where: {
                status: "NOTIFIED",
                reservedUntil: {
                    lt: now,
                },
            },
        });

        if (expired.length === 0) return;

        // process each expired reservation
        for (const entry of expired) {
            await prisma.$transaction(async (tx) => {
                // move user to bottom of queue by setting createdAt to now
                await tx.waitlistEntry.update({
                    where: { id: entry.id },
                    data: {
                        status: "WAITING",
                        reservedUntil: null,
                        notifiedAt: null,
                        createdAt: new Date(),
                    },
                });

                // trigger next user
                await triggerNextWaitlistUser(entry.rideId, tx);
            });
        }
    } catch (error) {
        console.error("handleExpiredReservations failed:", error);
    }
}