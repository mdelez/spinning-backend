import { Request } from "express";
import { User, Session } from "@prisma/client";

/**
 * A typed Express request for routes protected by authentication.
 * Guarantees `req.user` and `req.session` exist.
 *
 * @template ReqBody - request body type (default: empty object)
 * @template ResBody - response body type (default: unknown)
 * @template Params - request params type (default: empty object)
 */
export type WithAuth<
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    ReqBody extends Record<string, unknown> = {},
    ResBody = unknown,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Params extends Record<string, string> = {}
> = Request<Params, ResBody, ReqBody> & {
    user: User;
    session: Session;
};