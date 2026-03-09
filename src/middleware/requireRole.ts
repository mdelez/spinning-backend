import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export function requireRole(roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        console.log('user id: ', user?.id);
        console.log('user role: ', user?.role);

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        next();
    };
}