import { NextFunction, Request, Response } from "express";

export interface AuthUser {
    id: string;
    role: "USER" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export function fakeAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = req.header("x-user-id");
    const role = req.header("x-user-role") as AuthUser["role"] | undefined;

    if (!userId) {
        return res.status(401).json({ error: "Missing x-user-id header" });
    }

    req.user = {
        id: userId,
        role: role || "USER"
    };

    next();
}