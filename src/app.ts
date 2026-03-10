import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import ridesRoutes from "./routes/rides.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import studioRoutes from "./routes/studios.routes.js";
import { fakeAuth } from "./middleware/auth.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(usersRoutes);
app.use(ridesRoutes);
app.use(studioRoutes);
app.use(fakeAuth);
app.use(bookingsRoutes);