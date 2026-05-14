import { RideTokenTransactionType } from "@prisma/client";
import { z } from "zod";

export const purchaseTokensSchema = z.object({
    amountUnits: z.number().int().positive(),
});

export const createTokenTransactionSchema = z.object({
    userId: z.string(),
    amountUnits: z.number().int().refine((n) => n !== 0, {
        message: "amountUnits must be non-zero",
    }),
    type: z.enum([RideTokenTransactionType.MANUAL_ADJUSTMENT, RideTokenTransactionType.REFUND]),
    note: z.string().optional(),
});
