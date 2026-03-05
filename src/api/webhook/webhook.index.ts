import { createElysia } from "src/utils/createElysia";

/** Admin Routes */
import watiRoutes from "./wati/wati.routes";
/** Admin Routes */
export const webhookRoutes = createElysia({ prefix: "/webhook" });
webhookRoutes.use(watiRoutes);
