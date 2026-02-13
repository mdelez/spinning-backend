import { z } from "zod";

export const createSessionSchema = z.object({
    instructorId: z.string(),
    studioId: z.string(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    name: z.string(),
    description: z.string()
})

export const updateSessionSchema = z.object({
    instructorId: z.string().optional(),
    studioId: z.string().optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    name: z.string().optional(),
    description: z.string().optional()
})