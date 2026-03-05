import { createElysia } from "src/utils/createElysia";

/** Web Routes */
import homeRoutes from "./home/home.routes";
import gameTimeRoutes from "./game-time/game-time.routes";

/** Web Routes */
export const webRoutes = createElysia({ prefix: "/v1-web" });

// Game group
webRoutes.use(homeRoutes);
webRoutes.use(gameTimeRoutes);
