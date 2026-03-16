import { Response, RequestHandler } from "express";
import { WithAuth } from "../types/withAuth.js";

export function authed(
    handler: (req: WithAuth, res: Response) => Promise<void>
): RequestHandler {
    return async (req, res, next) => {
        try {
            await handler(req as WithAuth, res);
        } catch (err) {
            next(err);
        }
    };
}