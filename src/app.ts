import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import usersRoutes from "./routes/users.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(usersRoutes);
