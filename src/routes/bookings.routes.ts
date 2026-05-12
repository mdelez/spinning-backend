import { Router } from "express";
import { prisma } from "../prisma.js";
import { Prisma, Role } from "@prisma/client";
import { createBookingSchema, updateBookingSchema, addFriendBookingSchema } from "../zod/schemas/booking.schema.js";
import { requireRole } from "../middleware/requireRole.js";
import { authed } from "../middleware/authed.js";
import { triggerNextWaitlistUser } from "../services/services/triggerNextWaitlistUser.js";

const router = Router();

// GET /bookings?userId=[uuid]
router.get(
    "/bookings",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { userId } = req.query;

        try {
            const bookings = await prisma.booking.findMany({
                where: userId
                    ? { userId: userId as string }
                    : undefined, // no filter -> return all
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            shoeSize: true,
                        },
                    },
                    ride: {
                        include: {
                            studio: true,
                            instructor: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    bike: true,
                },
                orderBy: {
                    ride: {
                        startAt: "asc"
                    }
                },
            });

            res.json(bookings);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch bookings" });
        }
    }
    ));

// GET /bookings/me
router.get("/bookings/me", authed(async (req, res) => {
    const { user } = req;

    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: user.id },
            include: {
                ride: {
                    include: {
                        studio: true,
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                bike: true,
            },
            orderBy: {
                ride: {
                    startAt: "asc"
                }
            },
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch your bookings" });
    }
}));

// GET /bookings/:id - single booking
router.get("/bookings/:id", authed(async (req, res) => {
    const { user } = req;
    const { id } = req.params as { id: string };
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        shoeSize: true
                    }
                },
                ride: true,
                bike: true,
            },
        });

        if (!booking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        // ownership check
        if (
            (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) &&
            booking.userId !== user.id
        ) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch booking" });
    }
}));

router.post("/bookings", authed(async (req, res) => {
    const { user } = req;

    try {
        // parse and validate input
        const {
            rideId,
            userBikeId,
            friendBikeId,
            friendEmail,
            friendName,
            paid,
        } = createBookingSchema.parse(req.body);

        // count existing bookings for this user & ride
        const existingCount = await prisma.booking.count({
            where: { userId: user.id, rideId },
        });

        const bikesRequested = friendBikeId ? 2 : 1;

        // enforce max 2 bikes
        if (existingCount + bikesRequested > 2) {
            res.status(400).json({ error: "Maximum 2 bikes per ride allowed" });
            return;
        }

        // prevent same bike twice in request
        if (friendBikeId && friendBikeId === userBikeId) {
            res.status(400).json({ error: "Cannot book the same bike twice" });
            return;
        }

        // create bookings in a transaction
        const bookings = await prisma.$transaction(async (tx) => {
            const created: Prisma.BookingGetPayload<object>[] = [];

            // create user booking
            const userBooking = await tx.booking.create({
                data: {
                    userId: user.id,
                    rideId,
                    bikeId: userBikeId,
                    friendName: null,
                    friendShoeSize: null,
                    friendWaiverSigned: false,
                    paid,
                },
            });
            created.push(userBooking);

            // create friend booking if provided
            if (friendBikeId) {
                if (!friendEmail) {
                    throw new Error("Invalid friend email address provided");
                }

                const friendBooking = await tx.booking.create({
                    data: {
                        userId: user.id,
                        rideId,
                        bikeId: friendBikeId,
                        friendEmail,
                        friendName: friendName ?? "Friend",
                        friendWaiverSigned: false,
                        paid,
                    },
                });
                created.push(friendBooking);
            }

            return created;
        });

        res.status(201).json(bookings);
    } catch (error: unknown) {
        // bike already booked
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            res.status(400).json({ error: "One of the selected bikes is already booked" });
            return;
        }

        if (error instanceof Error && error.message === "Invalid friend email address provided") {
            res.status(400).json({ error: error.message });
            return;
        }

        console.error(error);
        res.status(400).json({
            error: "Invalid request body or booking could not be created",
        });
    }
}));

// PATCH /bookings/:id - update booking
router.patch("/bookings/:id", authed(async (req, res) => {
    const { user } = req;
    const { id } = req.params as { id: string };

    try {
        const parsedBody = updateBookingSchema.parse(req.body);

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        if (
            (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) &&
            booking.userId !== user.id
        ) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: parsedBody,
        });

        res.json(updatedBooking);
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Failed to update booking" });
    }
}));

// POST /bookings/add-friend
router.post("/bookings/add-friend", authed(async (req, res) => {
    const { user } = req;

    try {
        // parse and validate input
        const {
            rideId,
            friendBikeId,
            friendEmail,
            friendName,
        } = addFriendBookingSchema.parse(req.body);

        // fetch existing bookings for this user & ride
        const existingBookings = await prisma.booking.findMany({
            where: { userId: user.id, rideId },
        });

        if (existingBookings.length === 0) {
            res.status(400).json({ error: "No existing booking found to add friend to" });
            return;
        }

        if (existingBookings.length >= 2) {
            res.status(400).json({ error: "Cannot add friend: user already has max 2 bookings" });
            return;
        }

        // create friend booking in a transaction
        const [friendBooking] = await prisma.$transaction([
            prisma.booking.create({
                data: {
                    userId: user.id,
                    rideId,
                    bikeId: friendBikeId,
                    friendEmail,
                    friendName: friendName ?? "Friend",
                    friendWaiverSigned: false,
                    paid: false,
                },
            }),
        ]);

        res.status(201).json(friendBooking);
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            res.status(400).json({ error: "Selected bike is already booked" });
            return;
        }

        console.error(error);
        res.status(400).json({ error: "Could not add friend to booking" });
    }
}));

// TODO: can a friend's booking be deleted without also deleting the user's booking?
// DELETE /bookings/:id
router.delete("/bookings/:id", authed(async (req, res) => {
    const { user } = req;
    const { id } = req.params as { id: string };

    try {
        // fetch booking first to check ownership
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        if (
            (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) &&
            booking.userId !== user.id
        ) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.booking.delete({ where: { id } });
            await triggerNextWaitlistUser(booking.rideId, tx);
        });
        res.status(204).send(); // no content
    } catch (error: unknown) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete booking" });
    }
}));

// CHECK-IN /bookings/:id/checkin
router.patch(
    "/bookings/:id/checkin",
    requireRole([Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        try {
            const { user } = req;
            const { id } = req.params as { id: string };

            const booking = await prisma.booking.findUnique({
                where: { id },
                include: { ride: true },
            });

            if (!booking) {
                res.status(404).json({ error: "Booking not found" });
                return;
            }

            if (user.role === Role.INSTRUCTOR && booking.ride.instructorId !== user.id) {
                res.status(403).json({ error: "Not instructor of this ride" });
                return;
            }

            const updatedBooking = await prisma.booking.update({
                where: { id },
                data: {
                    checkedIn: !booking.checkedIn,
                    checkedInAt: booking.checkedIn ? null : new Date(),
                    checkedInBy: booking.checkedIn ? null : user.id,
                    checkedOutAt: booking.checkedIn ? new Date() : null,
                    checkedOutBy: user.id,
                },
            });

            res.json(updatedBooking);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to check in booking" });
        }
    }
    ));

export default router;