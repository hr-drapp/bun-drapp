import { createElysia } from "src/utils/createElysia";

import bolnaRoutes from "./bolna/bolna.routes";

/** Webhook Routes (public, each provider guards itself) */
export const webhookRoutes = createElysia({ prefix: "/webhook" });

// Bolna IVR
webhookRoutes.use(bolnaRoutes);
