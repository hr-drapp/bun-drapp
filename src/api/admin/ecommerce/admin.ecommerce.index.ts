import { createElysia } from "src/utils/createElysia";
import productRoutes from 'src/api/admin/ecommerce/product/product.routes'
/** Admin Ecommerce Routes */

/** Admin Ecommerce Routes */
export const ecommerceRoutes = createElysia({ prefix: "/ecommerce" });
ecommerceRoutes.use(productRoutes);
// apiRoutes.use(exampleController);
