import { z } from "zod";

export const createBookingSchema = z
    .object({
        userId: z.string(),
        sessionId: z.string(),
        userBikeId: z.string(),
        paid: z.boolean(),

        friendBikeId: z.string().optional(),
        friendEmail: z.email().optional(),
        friendName: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        const bringingFriend = !!data.friendBikeId;

        if (bringingFriend) {
            if (!data.friendEmail) {
                ctx.addIssue({
                    code: "custom",
                    message: "Friend email is required when bringing a friend",
                });
            }

            if (!data.friendName) {
                ctx.addIssue({
                    code: "custom",
                    message: "Friend name is required when bringing a friend",
                });
            }
        }
    });

export const updateBookingSchema = z.object({
    paid: z.boolean(),
    friendShoeSize: z.number().int().optional(),
    friendWaiverSigned: z.boolean().optional()
})

export const addFriendBookingSchema = z.object({
    userId: z.string(),
    sessionId: z.string(),
    friendBikeId: z.string(),
    friendEmail: z.email(),
    friendName: z.string(),
})