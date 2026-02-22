import { Router } from "express";
import { prisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import { createSessionSchema, updateSessionSchema } from "../zod/schemas/session.schema.js";

const router = Router();

// GET /sessions - all sessions
router.get("/sessions", async (_req, res) => {
    try {
        const sessions = await prisma.session.findMany({
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
        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// GET /sessions/:id - single session
router.get("/sessions/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const session = await prisma.session.findUnique({
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
        if (session) {
            res.json(session);
        } else {
            res.status(404).json({ error: "Session not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});

// GET /sessions/:id/bookings - get all bookings for single session
router.get("/sessions/:id/bookings", async (req, res) => {
    try {
        const { id } = req.params;

        const bookings = await prisma.booking.findMany({
            where: {
                sessionId: id,
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
            },
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// GET /sessions/:id/available-bikes
router.get("/sessions/:id/available-bikes", async (req, res) => {
    const { id } = req.params;

    // Find the session and its studio
    const session = await prisma.session.findUnique({
        where: { id },
        include: { bookings: true },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Get all bikes in this studio
    const allBikes = await prisma.bike.findMany({
        where: { studioId: session.studioId },
    });

    // Remove bikes that are already booked
    const bookedBikeIds = session.bookings.map(b => b.bikeId);
    const availableBikes = allBikes.filter(bike => !bookedBikeIds.includes(bike.id));

    res.json(availableBikes);
});

// POST /sessions - create session
router.post("/sessions", async (req, res) => {
    try {
        const parsedBody = createSessionSchema.parse(req.body);

        const newSession = await prisma.session.create({
            data: parsedBody,
        });

        res.status(201).json(newSession);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(400).json({ error: "Duplicate unique field" });
        }
        console.error(error);
        res.status(400).json({ error: "Invalid request body when creating session" });
    }
});

// PATCH /sessions/:id - update session
router.patch("/sessions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const parsedBody = updateSessionSchema.parse(req.body);

        const updatedSession = await prisma.session.update({
            where: { id },
            data: parsedBody,
        });

        res.json(updatedSession);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "Session not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to update session" });
    }
});

// DELETE /sessions/:id - delete session
router.delete("/sessions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.session.delete({ where: { id } });
        res.status(204).send(); // no content
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "Session not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to delete session" });
    }
});

export default router;