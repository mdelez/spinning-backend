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
