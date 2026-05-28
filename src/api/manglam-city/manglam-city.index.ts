import { createElysia } from "src/utils/createElysia";
import contributionRoutes from "./contribution/contribution.routes";

export const manglamCityRoutes = createElysia({ prefix: "/manglam-city" });
manglamCityRoutes.use(contributionRoutes);
