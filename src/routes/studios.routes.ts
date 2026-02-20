import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /studios
router.get("/studios", async (_req, res) => {
    try {
        const studios = await prisma.studio.findMany();
        res.json(studios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch studios" });
    }
});

// GET /studios/:id
router.get("/studios/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const studio = await prisma.studio.findUnique({ where: { id } });
        if (studio) {
            res.json(studio);
        } else {
            res.status(404).json({ error: "Studio not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch studio" });
    }
});

// GET /studios/:id/bikes
router.get("/studios/:id/bikes", async (req, res) => {
    const { id } = req.params;

    try {
        const bikes = await prisma.bike.findMany({
            where: { studioId: id }
        });

        res.json(bikes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch bikes" });
    }
});

export default router;