import { prisma } from "../../prisma.js";
import { triggerNextWaitlistUser } from "./triggerNextWaitlistUser.js";

const MAX_NOTIFY_COUNT = 2;

export async function handleExpiredReservations() {
    const now = new Date();

    try {
        const expired = await prisma.waitlistEntry.findMany({
            where: { status: "NOTIFIED", reservedUntil: { lt: now } },
        });

        if (expired.length === 0) return;

        for (const entry of expired) {
            await prisma.$transaction(async (tx) => {
                const newNotifyCount = entry.notifyCount + 1;

                if (newNotifyCount >= MAX_NOTIFY_COUNT) {
                    await tx.waitlistEntry.delete({ where: { id: entry.id } });
                } else {
                    await tx.waitlistEntry.update({
                        where: { id: entry.id },
                        data: {
                            status: "WAITING",
                            reservedUntil: null,
                            notifiedAt: null,
                            notifyCount: newNotifyCount,
                            createdAt: new Date(),
                        },
                    });
                }

                await triggerNextWaitlistUser(entry.rideId, tx);
            });
        }
    } catch (error) {
        console.error("handleExpiredReservations failed:", error);
    }
}
