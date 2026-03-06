import { RideType } from "@prisma/client";
import { z } from "zod";

export const createSessionSchema = z.object({
    instructorId: z.string(),
    studioId: z.string(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    theme: z.string().optional(),
    description: z.string().optional(),
    rideType: z.enum(RideType),
    tokenPrice: z.number().min(1)
})

export const updateSessionSchema = z.object({
    instructorId: z.string().optional(),
    studioId: z.string().optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    theme: z.string().optional(),
    description: z.string().optional(),
    rideType: z.enum(RideType).optional(),
    tokenPrice: z.number().min(0).optional(),
});