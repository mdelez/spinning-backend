import { NextFunction, Request, Response } from "express";

export function requireRole(roles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({ error: "Unauthorized Role" });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ error: "Forbidden" });
            }

            next();
        } catch (err) {
            console.error("Auth error:", err);
            res.status(500).json({ error: "Auth check failed" });
        }
    }
};