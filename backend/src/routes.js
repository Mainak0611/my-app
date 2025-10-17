// backend/src/routes.js

// Import all module route files
import paymentRoutes from "./modules/payments/paymentRoutes.js";

/**
 * Registers all module routes with the main Express application instance.
 * @param {object} app - The Express application instance.
 */
const registerRoutes = (app) => {
    // Register Payment Module routes under the /api/payments base path
    app.use("/api/payments", paymentRoutes);

    // Future modules would be registered here:
    // app.use("/api/inventory", inventoryRoutes);
    // app.use("/api/clients", clientRoutes);
};

export default registerRoutes;