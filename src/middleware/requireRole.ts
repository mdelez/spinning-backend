import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export function requireRole(roles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });
            console.log('headers: ', fromNodeHeaders(req.headers));
            console.log('session: ', session);

            if (!session?.user) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = session.user;

            if (!roles.includes(user.role)) {
                return res.status(403).json({ error: "Forbidden" });
            }

            // attach the user to req so the route can use it
            req.user = {
                ...user,
                image: user.image ? user.image : null,
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth : null
            };

            next();
        } catch (err) {
            console.error("Auth error:", err);
            res.status(500).json({ error: "Auth check failed" });
        }
    }
};