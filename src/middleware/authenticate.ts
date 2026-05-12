import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = {
            ...session.user,
            image: session.user.image ?? null,
            dateOfBirth: session.user.dateOfBirth ?? null,
        };

        req.session = {
            ...session.session,
            ipAddress: session.session.ipAddress ?? null,
            userAgent: session.session.userAgent ?? null
        }

        next();
    } catch (err) {
        console.error("Auth error:", err);
        res.status(500).json({ error: "Auth check failed" });
    }
}