import { Router } from "express";
import { prisma } from "../prisma.js";
import { createUserSchema, updateUserSchema } from "../zod/schemas/user.schema.js";
import { Prisma } from "@prisma/client";

const router = Router();

// GET /users
router.get("/users", async (_req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /users/:id
router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
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
});

// POST /users
router.post("/users", async (req, res) => {
    try {
        const parsedBody = createUserSchema.parse(req.body);

        const newUser = await prisma.user.create({
            data: parsedBody
        });

        res.status(201).json(newUser);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            Array.isArray(error.meta?.target) &&
            error.meta.target.includes("email")
        ) {
            console.error(error);
            return res.status(400).json({ error: "An account with this email address already exists" });
        } else {
            console.error(error);
            res.status(400).json({ error: "Invalid request body when creating user" })
        }
    }
})

// PATCH /users/:id
router.patch("/users/:id", async (req, res) => {
    const { id } = req.params;

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
});

// DELETE /users/:id
router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({ where: { id } });
        res.status(204).send(); // no content
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({ error: "Failed to delete user" });
    }
})

export default router;
