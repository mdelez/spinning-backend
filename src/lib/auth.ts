import { expo } from "@better-auth/expo";
import { PrismaClient, Role } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

const client = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(client, { provider: "postgresql" }),
    baseURL: "http://localhost:3000/",
    user: {
        additionalFields: {
            firstName: {
                type: "string",
                required: true
            },
            lastName: {
                type: "string",
                required: true
            },
            shoeSize: {
                type: "number",
                required: true
            },
            dateOfBirth: {
                type: "date",
                required: false
            },
            role: {
                type: Object.values(Role),
                required: true,
                defaultValue: "USER",
                input: false, // don't allow user to set role
            }
        },
    },
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        expo(),
        bearer()
    ],
    trustedOrigins: [
        'spinningapp://', // correct Expo scheme

        // Development mode - Expo's exp:// scheme with local IP ranges
        ...(process.env.NODE_ENV === "development" ? [
            "exp://",                      // Trust all Expo URLs (prefix matching)
            "exp://**",                    // Trust all Expo URLs (wildcard matching)
            'http://localhost:3000',       // web / dev testing
            `${process.env.LOCAL_HOST_URL}:3000`,
            "exp+spinning-app://**"
        ] : [])
    ],
    socialProviders: {
        // apple: {
        //     clientId: process.env.APPLE_CLIENT_ID!,
        //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
        // },
        // facebook: {
        //     clientId: process.env.FACEBOOK_CLIENT_ID!,
        //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        // },
        // google: {
        //     clientId: process.env.GOOGLE_CLIENT_ID!,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // },
    },
});
