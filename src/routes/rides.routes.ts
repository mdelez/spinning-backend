import { Router } from "express";
import { prisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import { createRideSchema, updateRideSchema } from "../zod/schemas/ride.schema.js";

const router = Router();

// GET /rides?instructorId=[uuid]
router.get("/rides", async (req, res) => {
    try {
        const { instructorId } = req.query;

        const rides = await prisma.ride.findMany({
            where: instructorId
                ? { instructorId: String(instructorId) }
                : undefined,
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                studio: true,
            },
        });

        res.json(rides);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

// GET /rides/:id - single ride
router.get("/rides/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const ride = await prisma.ride.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                studio: true,
                // bookings: true,
            },
        });
        if (ride) {
            res.json(ride);
        } else {
            res.status(404).json({ error: "ride not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch ride" });
    }
});

// GET /rides/:id/bookings - get all bookings for single ride
router.get("/rides/:id/bookings", async (req, res) => {
    try {
        const { id } = req.params;

        const bookings = await prisma.booking.findMany({
            where: {
                rideId: id,
            },
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
                bike: {
                    select: {
                        bikeNumber: true
                    }
                }
            },
            orderBy: {
                bike: {
                    id: 'asc'
                }
            }
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// GET /rides/:id/available-bikes
router.get("/rides/:id/available-bikes", async (req, res) => {
    const { id } = req.params;

    // Find the ride and its studio
    const ride = await prisma.ride.findUnique({
        where: { id },
        include: { bookings: true },
    });

    if (!ride) return res.status(404).json({ error: "ride not found" });

    // Get all bikes in this studio
    const allBikes = await prisma.bike.findMany({
        where: { studioId: ride.studioId },
    });

    // Remove bikes that are already booked
    const bookedBikeIds = ride.bookings.map(b => b.bikeId);
    const availableBikes = allBikes.filter(bike => !bookedBikeIds.includes(bike.id));

    res.json(availableBikes);
});

// POST /rides - create ride
router.post("/rides", async (req, res) => {
    try {
        const parsedBody = createRideSchema.parse(req.body);

        const newride = await prisma.ride.create({
            data: parsedBody,
            include: {
                instructor: true
            }
        });

        res.status(201).json(newride);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(400).json({ error: "Duplicate unique field" });
        }
        console.error(error);
        res.status(400).json({ error: "Invalid request body when creating ride" });
    }
});

// PATCH /rides/:id - update ride
router.patch("/rides/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const parsedBody = updateRideSchema.parse(req.body);

        const updatedride = await prisma.ride.update({
            where: { id },
            data: parsedBody,
            include: {
                instructor: true
            }
        });

        res.status(200).json(updatedride);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "ride not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to update ride" });
    }
});

// DELETE /rides/:id - delete ride
router.delete("/rides/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.ride.delete({ where: { id } });
        res.status(204).send(); // no content
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "ride not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to delete ride" });
    }
});

export default router;