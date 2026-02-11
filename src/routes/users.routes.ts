import { Router } from "express";
import { prisma } from "../prisma.js"; // your Prisma client

const router = Router();

// GET /users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
