import { Router } from "express";
import { prisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import { createBookingSchema, updateBookingSchema, addFriendBookingSchema } from "../zod/schemas/booking.schema.js";
import { AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// GET /bookings?userId=[uuid]
router.get("/bookings", async (req, res) => {
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
});

// GET /bookings/:id - single booking
router.get("/bookings/:id", async (req, res) => {
    const { id } = req.params;
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
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ error: "Booking not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch booking" });
    }
});

router.post("/bookings", async (req, res) => {
    try {
        // parse and validate input
        const {
            userId,
            rideId,
            userBikeId,
            friendBikeId,
            friendEmail,
            friendName,
            paid,
        } = createBookingSchema.parse(req.body);

        // count existing bookings for this user & ride
        const existingCount = await prisma.booking.count({
            where: { userId, rideId },
        });

        const bikesRequested = friendBikeId ? 2 : 1;

        // enforce max 2 bikes
        if (existingCount + bikesRequested > 2) {
            return res.status(400).json({
                error: "Maximum 2 bikes per ride allowed",
            });
        }

        // prevent same bike twice in request
        if (friendBikeId && friendBikeId === userBikeId) {
            return res.status(400).json({
                error: "Cannot book the same bike twice",
            });
        }

        // create bookings in a transaction
        const bookings = await prisma.$transaction(async (tx) => {
            const created: Prisma.BookingGetPayload<object>[] = [];

            // create user booking
            const userBooking = await tx.booking.create({
                data: {
                    userId,
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
                    return res.status(400).json({
                        error: "Invalid friend email address provided",
                    });
                }

                const friendBooking = await tx.booking.create({
                    data: {
                        userId,
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

        return res.status(201).json(bookings);
    } catch (error) {
        // bike already booked
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(400).json({
                error: "One of the selected bikes is already booked",
            });
        }

        console.error(error);
        return res.status(400).json({
            error: "Invalid request body or booking could not be created",
        });
    }
});

// PATCH /bookings/:id - update booking
router.patch("/bookings/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const parsedBody = updateBookingSchema.parse(req.body);

        const updatedbooking = await prisma.booking.update({
            where: { id },
            data: parsedBody,
        });

        res.json(updatedbooking);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "Booking not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to update booking" });
    }
});

// POST /bookings/add-friend
router.post("/bookings/add-friend", async (req, res) => {
    try {
        // parse and validate input
        const {
            userId,
            rideId,
            friendBikeId,
            friendEmail,
            friendName
        } = addFriendBookingSchema.parse(req.body);

        // count existing bookings for this user/ride
        const existingBookings = await prisma.booking.findMany({
            where: { userId, rideId },
        });

        if (existingBookings.length === 0) {
            return res.status(400).json({
                error: "No existing booking found to add friend to",
            });
        }

        if (existingBookings.length >= 2) {
            return res.status(400).json({
                error: "Cannot add friend: user already has max 2 bookings",
            });
        }

        // create friend booking in a transaction
        const [friendBooking] = await prisma.$transaction([
            prisma.booking.create({
                data: {
                    userId,
                    rideId,
                    bikeId: friendBikeId,
                    friendName,
                    friendEmail
                },
            }),
        ]);

        return res.status(201).json(friendBooking);
    } catch (error) {
        // bike already booked
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(400).json({
                error: "Selected bike is already booked",
            });
        }

        console.error(error);
        return res.status(400).json({
            error: "Could not add friend to booking",
        });
    }
});

// TODO: can a friend's booking be deleted without also deleting the user's booking?
// DELETE /bookings/:id
router.delete("/bookings/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.booking.delete({ where: { id } });
        res.status(204).send(); // no content
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "Booking not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

// CHECK-IN /bookings/:id/checkin
router.patch(
    "/bookings/:id/checkin",
    requireRole(["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]),
    async (req: AuthRequest, res) => {
        try {
            const { id } = req.params as { id: string };
            const user = req.user!; // guaranteed by auth middleware

            const booking = await prisma.booking.findUnique({
                where: { id },
                include: { ride: true },
            });

            if (!booking) {
                return res.status(404).json({ error: "Booking not found" });
            }

            // instructors can only check in their own rides
            if (user.role === "INSTRUCTOR" && booking.ride.instructorId !== user.id) {
                return res.status(403).json({ error: "Not instructor of this ride" });
            }

            let updatedBooking;

            if (booking.checkedIn) {
                // check out
                updatedBooking = await prisma.booking.update({
                    where: { id },
                    data: {
                        checkedIn: false,
                        checkedInAt: null,
                        checkedInBy: null,
                        checkedOutAt: new Date(),
                        checkedOutBy: user.id
                    },
                });
            } else {
                // check in
                updatedBooking = await prisma.booking.update({
                    where: { id },
                    data: {
                        checkedIn: true,
                        checkedInAt: new Date(),
                        checkedInBy: user.id,
                        checkedOutAt: null,
                        checkedOutBy: user.id
                    },
                });
            }

            res.json(updatedBooking);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to check in booking" });
        }
    }
);

export default router;