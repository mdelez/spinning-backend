import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import ridesRoutes from "./routes/rides.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import studioRoutes from "./routes/studios.routes.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";

export const app = express();

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(usersRoutes);
app.use(ridesRoutes);
app.use(studioRoutes);
app.use(bookingsRoutes);