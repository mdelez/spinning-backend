import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function triggerNextWaitlistUser(
    rideId: string,
    tx: Prisma.TransactionClient = prisma
) {
    const now = new Date();

    const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { studio: { include: { bikes: true } } },
    });
    if (!ride) return;

    const totalBikes = ride.studio.bikes.length;
    const bookingCount = await tx.booking.count({ where: { rideId } });
    const notifiedCount = await tx.waitlistEntry.count({
        where: { rideId, status: "NOTIFIED", reservedUntil: { gt: now } },
    });

    let openSlots = totalBikes - bookingCount - notifiedCount;
    if (openSlots <= 0) return;

    const waitingEntries = await tx.waitlistEntry.findMany({
        where: { rideId, status: "WAITING" },
        orderBy: { createdAt: "asc" },
        take: openSlots,
    });

    for (const entry of waitingEntries) {
        if (openSlots <= 0) break;

        if (entry.autoBook) {
            const bookedBikeIds = (
                await tx.booking.findMany({ where: { rideId }, select: { bikeId: true } })
            ).map((b) => b.bikeId);

            const availableBike = ride.studio.bikes.find((b) => !bookedBikeIds.includes(b.id));

            if (availableBike) {
                const { _sum } = await tx.rideTokenTransaction.aggregate({
                    where: { userId: entry.userId },
                    _sum: { amountUnits: true },
                });
                const balance = _sum.amountUnits ?? 0;

                if (balance >= ride.tokenPriceUnits) {
                    await tx.booking.create({
                        data: { userId: entry.userId, rideId, bikeId: availableBike.id, paid: false },
                    });
                    await tx.rideTokenTransaction.create({
                        data: {
                            userId: entry.userId,
                            rideId,
                            amountUnits: -ride.tokenPriceUnits,
                            type: "BOOKING",
                        },
                    });
                    await tx.waitlistEntry.delete({ where: { id: entry.id } });
                    openSlots--;
                    // TODO: notify user they were auto-booked
                    continue;
                }
            }
        }

        // notify-only path (also fallback if auto-book user lacks tokens or no bike found)
        await tx.waitlistEntry.update({
            where: { id: entry.id },
            data: {
                status: "NOTIFIED",
                reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
                notifiedAt: now,
            },
        });
        openSlots--;
        // TODO: notify user their spot is ready
    }
}
