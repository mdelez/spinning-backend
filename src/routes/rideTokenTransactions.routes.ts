import { Router } from "express";
import { prisma } from "../prisma.js";
import { Role } from "@prisma/client";
import { requireRole } from "../middleware/requireRole.js";
import { authed } from "../middleware/authed.js";
import { createTokenTransactionSchema, purchaseTokensSchema } from "../zod/schemas/rideTokenTransaction.schema.js";

const router = Router();

async function computeBalance(userId: string): Promise<number> {
    const { _sum } = await prisma.rideTokenTransaction.aggregate({
        where: { userId },
        _sum: { amountUnits: true },
    });
    return _sum.amountUnits ?? 0;
}

// GET /ride-token-transactions/balance
router.get("/ride-token-transactions/balance", authed(async (req, res) => {
    const { user } = req;
    const balance = await computeBalance(user.id);
    res.json({ balance });
}));

// GET /ride-token-transactions?userId=[uuid]
router.get(
    "/ride-token-transactions",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { userId } = req.query;

        const transactions = await prisma.rideTokenTransaction.findMany({
            where: userId ? { userId: userId as string } : undefined,
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                ride: {
                    select: { id: true, startAt: true, rideType: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(transactions);
    })
);

// GET /ride-token-transactions/balance/:userId
router.get(
    "/ride-token-transactions/balance/:userId",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { userId } = req.params as { userId: string };

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const balance = await computeBalance(userId);
        res.json({ balance });
    })
);

// TODO: replace with Stripe webhook once payments are integrated
// POST /ride-token-transactions/purchase
router.post("/ride-token-transactions/purchase", authed(async (req, res) => {
    const { user } = req;
    const { amountUnits } = purchaseTokensSchema.parse(req.body);

    const transaction = await prisma.rideTokenTransaction.create({
        data: { userId: user.id, amountUnits, type: "PURCHASE" },
    });

    res.status(201).json(transaction);
}));

// POST /ride-token-transactions
router.post(
    "/ride-token-transactions",
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    authed(async (req, res) => {
        const { userId, amountUnits, type } = createTokenTransactionSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const transaction = await prisma.rideTokenTransaction.create({
            data: { userId, amountUnits, type },
        });

        res.status(201).json(transaction);
    })
);

export default router;
