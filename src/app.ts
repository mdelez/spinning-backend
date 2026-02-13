import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(usersRoutes);
app.use(sessionsRoutes);
