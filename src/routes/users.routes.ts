import { Router } from "express";
import multer from "multer";
import { prisma } from "../prisma.js";
import { updateUserSchema } from "../zod/schemas/user.schema.js";
import { Prisma, Role } from "@prisma/client";
import { requireRole } from "../middleware/requireRole.js";
import { authed } from "../middleware/authed.js";
import { uploadToR2 } from "../lib/r2.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
            return;
        }
        cb(null, true);
    },
});

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
    authed(async (_req, res) => {
        try {
            const users = await prisma.user.findMany({
                where: { role: Role.INSTRUCTOR },
                include: { instructorProfile: true }
            });
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch instructors" });
        }
    })
);

// GET /users/instructors/:id
router.get("/users/instructors/:id", authed(async (req, res) => {
    const { id } = req.params as { id: string };
    try {
        const instructor = await prisma.user.findUnique({
            where: { id, role: Role.INSTRUCTOR },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                instructorProfile: {
                    select: { bio: true, spotifyLink: true, image: true },
                },
            },
        });
        if (!instructor) {
            res.status(404).json({ error: "Instructor not found" });
            return;
        }
        res.json(instructor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch instructor" });
    }
}));

// GET /users/me
router.get("/users/me", authed(async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                instructorProfile: {
                    select: {
                        bio: true,
                        image: true,
                        spotifyLink: true,
                    }
                }
            }
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
        const { bio, spotifyLink, ...userFields } = updateUserSchema.parse(req.body);

        if ((bio !== undefined || spotifyLink !== undefined) && req.user.role !== Role.INSTRUCTOR) {
            res.status(403).json({ error: "Only instructors can update bio and Spotify link" });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...userFields,
                ...(bio !== undefined || spotifyLink !== undefined
                    ? {
                        instructorProfile: {
                            upsert: {
                                create: { bio, spotifyLink },
                                update: { bio, spotifyLink },
                            },
                        },
                    }
                    : {}),
            },
            include: { instructorProfile: true },
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
            const { bio, spotifyLink, ...userFields } = updateUserSchema.parse(req.body);

            if (bio !== undefined || spotifyLink !== undefined) {
                const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
                if (!target) {
                    res.status(404).json({ error: "User not found" });
                    return;
                }
                if (target.role !== Role.INSTRUCTOR) {
                    res.status(403).json({ error: "Only instructors can have a bio and Spotify link" });
                    return;
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    ...userFields,
                    ...(bio !== undefined || spotifyLink !== undefined
                        ? {
                            instructorProfile: {
                                upsert: {
                                    create: { bio, spotifyLink },
                                    update: { bio, spotifyLink },
                                },
                            },
                        }
                        : {}),
                },
                include: { instructorProfile: true },
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

// PATCH /users/instructors/:id/profile
router.patch(
    "/users/instructors/:id/profile",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR]),
    authed(async (req, res) => {
        const { id } = req.params as { id: string };

        if (req.user.role === Role.INSTRUCTOR && req.user.id !== id) {
            res.status(403).json({ error: "Instructors can only update their own profile" });
            return;
        }

        const { bio, spotifyLink } = req.body as { bio?: string; spotifyLink?: string };

        const updated = await prisma.instructorProfile.upsert({
            where: { userId: id },
            create: { userId: id, bio, spotifyLink },
            update: { bio, spotifyLink },
        });

        res.json(updated);
    })
);

// POST /users/instructors/:id/image
router.post(
    "/users/instructors/:id/image",
    requireRole([Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN]),
    upload.single("image"),
    authed(async (req, res) => {
        const { id } = req.params as { id: string };

        if (req.user.role === Role.INSTRUCTOR && req.user.id !== id) {
            res.status(403).json({ error: "Instructors can only update their own image" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: "No image file provided" });
            return;
        }

        const instructor = await prisma.user.findUnique({
            where: { id, role: Role.INSTRUCTOR },
            select: { id: true },
        });

        if (!instructor) {
            res.status(404).json({ error: "Instructor not found" });
            return;
        }

        const ext = req.file.mimetype.split("/")[1];
        const key = `instructors/${id}/profile.${ext}`;
        const imageUrl = await uploadToR2(key, req.file.buffer, req.file.mimetype);

        const updated = await prisma.instructorProfile.upsert({
            where: { userId: id },
            create: { userId: id, image: imageUrl },
            update: { image: imageUrl },
            select: { userId: true, image: true },
        });

        res.json(updated);
    })
);

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
