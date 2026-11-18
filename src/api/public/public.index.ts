import { createElysia } from "src/utils/createElysia";
import groundRoutes from "./ground/ground.routes";

/** Public routes (no admin login). Each feature guards itself. */
export const publicRoutes = createElysia({ prefix: "/public" });

// Ground team patient registration form: /public/ground/*
publicRoutes.use(groundRoutes);
