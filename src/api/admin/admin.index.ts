import { createElysia } from "src/utils/createElysia";

/** Admin Routes */
import authRoutes from "./auth/auth.routes";
import rolesRoutes from "./roles/roles.routes";
import moduleRoutes from "./modules/module.routes";
import adminsRoutes from "./admins/admins.routes";
import categoriesRoutes from "./categories/categories.routes";
import countryRoutes from "./country/country.routes";
import astrologersRoutes from "./astrologers/astrologers.routes";
import verificationRoutes from "./verification/verification.routes";
import usersRoutes from "./users/users.routes";
import { ecommerceRoutes } from "./ecommerce/admin.ecommerce.index";
import wallet_plansRoutes from "./wallet_plans/wallet_plans.routes";
import gamesRoutes from "./games/games.routes";
import satta_number_entryRoutes from "./satta_number_entry/satta_number_entry.routes";
import satta_entryRoutes from "./satta_entry/satta_entry.routes";
import dashboardRoutes from "./dashboard/dashboard.routes";
import settingRoutes from "./setting/setting.routes";
import admin_requestsRoutes from "./admin_requests/admin_requests.routes";
import satta_number_entry_shareRoutes from "./satta_number_entry_share/satta_number_entry_share.routes";
import clientRoutes from "./client/client.routes";
import groupRoutes from "./group/group.routes";
import messageRoute from "./message/message.route";
import hisabRoutes from "./hisab-book/hisab.routes";
import noticeRoutes from "./notice/notice.routes";
import gameCategoryRoutes from "./game-category/game-category.routes";
import gameTimeRoutes from "./game-time/game-time.routes";
import numbersRoutes from "./numbers/numbers.routes";
import numbers_entryRoutes from "./numbers-entry/numbers-entry.routes";
import number_entry_shareRoutes from "./number-entry-share/number-entry-share.routes";
import spinner_dashboardRoutes from "./spinner-dashboard/spinner-dashboard.routes";
import gamesNumberRoutes from "./games-number/games-number.routes";
import groupGameTimeRoutes from "./group-game-time/group-game-time.routes";
import groupAdminRoutes from "./group-admin/group-admin.routes";
import hisabComissionRoutes from "./hisab-comission/hisab-comission.routes";
import spinnerResultRoutes from "./spinner-result/spinner-result.routes";
import homeRoutes from "./home/home.routes";
import spinnerMarketRoutes from "./spinner-market/spinner-market.routes";
import walletRoutes from "./wallet/wallet.routes";
import walletTransactionRoutes from "./wallet-transaction/wallet-transaction.routes";
import doctorRoutes from "./doctor/doctor.routes";
/** Admin Routes */
export const adminRoutes = createElysia({ prefix: "/admin" });
adminRoutes.use(authRoutes);
adminRoutes.use(rolesRoutes);
adminRoutes.use(moduleRoutes);
adminRoutes.use(adminsRoutes);
adminRoutes.use(categoriesRoutes);

// Game group
adminRoutes.use(gameCategoryRoutes);
adminRoutes.use(gamesRoutes);
adminRoutes.use(gameTimeRoutes);
adminRoutes.use(gamesNumberRoutes);

// numbers group
adminRoutes.use(numbersRoutes);
adminRoutes.use(numbers_entryRoutes);
adminRoutes.use(number_entry_shareRoutes);
adminRoutes.use(spinnerMarketRoutes);

// hisab & result
adminRoutes.use(hisabComissionRoutes);
adminRoutes.use(spinnerResultRoutes);

// Group & notcie
adminRoutes.use(noticeRoutes);
adminRoutes.use(groupGameTimeRoutes);
adminRoutes.use(groupAdminRoutes);
adminRoutes.use(groupRoutes);

adminRoutes.use(countryRoutes);
adminRoutes.use(astrologersRoutes);
adminRoutes.use(verificationRoutes);
adminRoutes.use(usersRoutes);
adminRoutes.use(wallet_plansRoutes);
adminRoutes.use(walletRoutes);

adminRoutes.use(satta_number_entryRoutes);
adminRoutes.use(satta_entryRoutes);

// dashboard's
adminRoutes.use(dashboardRoutes);
adminRoutes.use(spinner_dashboardRoutes);
adminRoutes.use(homeRoutes);

adminRoutes.use(settingRoutes);
adminRoutes.use(admin_requestsRoutes);
adminRoutes.use(satta_number_entry_shareRoutes);
adminRoutes.use(clientRoutes);
adminRoutes.use(messageRoute);
adminRoutes.use(hisabRoutes);

// wallet routes
adminRoutes.use(walletTransactionRoutes);

adminRoutes.use(ecommerceRoutes);

// Doctor Route
adminRoutes.use(doctorRoutes);
