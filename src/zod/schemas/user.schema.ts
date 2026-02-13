import { z } from "zod";

export const createUserSchema = z.object({
    email: z.email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    shoeSize: z.int(),
    dateOfBirth: z.coerce.date(),
    instructor: z.boolean(),
    admin: z.boolean()
});

export const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    shoeSize: z.number().int().optional(),
    dateOfBirth: z.coerce.date().optional()
});