import { Router } from "express";
import { prisma } from "../prisma.js";
import { updateUserSchema } from "../zod/schemas/user.schema.js";
import { Prisma, Role } from "@prisma/client";
import { requireRole } from "../middleware/requireRole.js";
import { authed } from "../middleware/authed.js";

const router = Router();

// GET /users
router.get(
    "/users",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (_req, res) => {
        try {
            const users = await prisma.user.findMany();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    })
);

// GET /users/instructors
router.get(
    "/users/instructors",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (_req, res) => {
        try {
            const users = await prisma.user.findMany({ where: { role: Role.INSTRUCTOR } });
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch instructors" });
        }
    })
);

// GET /users/me
router.get("/users/me", authed(async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
}));

// GET /users/:id
router.get(
    "/users/:id",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { id } = req.params as { id: string };
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ error: "User not found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch user" });
        }
    })
);

router.get("/users/rides/me", authed(async (req, res) => {
    const userId = req.user.id;

    try {
        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                ride: {
                    include: {
                        studio: true,
                        instructor: {
                            select: {
                                firstName: true
                            }
                        }
                    }
                },
                bike: {
                    select: {
                        bikeNumber: true
                    }
                }
            },
        });

        const waitlistEntries = await prisma.waitlistEntry.findMany({
            where: { userId },
            include: {
                ride: {
                    include: {
                        studio: true,
                        instructor: {
                            select: {
                                firstName: true
                            }
                        }
                    }
                }
            },
        });

        const bookedRides = bookings.map((b) => ({
            rideId: b.rideId,
            startAt: b.ride.startAt,
            endAt: b.ride.endAt,
            theme: b.ride.theme,
            rideType: b.ride.rideType,
            instructor: b.ride.instructor.firstName,
            studioName: b.ride.studio.name,
            status: "BOOKED",
            booking: {
                bikeNumber: b.bike.bikeNumber,
            },
            waitlist: null,
        }));

        const waitlistedRides = await Promise.all(
            waitlistEntries.map(async (w) => {
                // compute position in queue
                const position = await prisma.waitlistEntry.count({
                    where: {
                        rideId: w.rideId,
                        status: "WAITING",
                        createdAt: { lt: w.createdAt },
                    },
                });

                return {
                    rideId: w.rideId,
                    startAt: w.ride.startAt,
                    endAt: w.ride.endAt,
                    theme: w.ride.theme,
                    rideType: w.ride.rideType,
                    instructor: w.ride.instructor.firstName,
                    studioName: w.ride.studio.name,
                    status: "WAITLISTED",
                    booking: null,
                    waitlist: {
                        position: w.status === "WAITING" ? position + 1 : null,
                        status: w.status,
                        reservedUntil: w.reservedUntil,
                    },
                };
            })
        );

        // merge and sort by date
        const result = [...bookedRides, ...waitlistedRides].sort(
            (a, b) =>
                new Date(a.startAt).getTime() -
                new Date(b.startAt).getTime()
        );

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch user rides" });
    }
}));

// PATCH /users/me
router.patch("/users/me", authed(async (req, res) => {
    try {
        const parsedBody = updateUserSchema.parse(req.body);

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: parsedBody,
        });

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update user" });
    }
}));

// PATCH /users/:id
router.patch(
    "/users/:id",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { id } = req.params as { id: string };

        try {
            const parsedBody = updateUserSchema.parse(req.body);

            const updatedUser = await prisma.user.update({
                where: { id },
                data: parsedBody,
            });

            res.json(updatedUser);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to update user" });
        }
    })
);

// DELETE /users/me
router.delete("/users/me", authed(async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.user.id },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete user" });
    }
}));

// DELETE /users/:id
router.delete(
    "/users/:id",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { id } = req.params as { id: string };

        try {
            await prisma.user.delete({ where: { id } });
            res.status(204).send(); // no content
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            ) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.status(500).json({ error: "Failed to delete user" });
        }
    })
);

export default router;
