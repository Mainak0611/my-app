// /backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import registerRoutes from "./routes.js";

dotenv.config();

const app = express();

/**
 * Allowed origins:
 * - Read from env ALLOWED_ORIGINS (comma separated)
 * - Defaults include localhost dev URL so local dev still works
 *
 * Example env value:
 * ALLOWED_ORIGINS="https://murti-blush.vercel.app,http://localhost:5173"
 */
const rawAllowed = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
const allowedOrigins = rawAllowed
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// CORS options with dynamic origin check
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // If origin is allowed, allow it
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Not allowed: respond without throwing an error.
    // Returning (null, false) will make the CORS middleware not set
    // Access-Control-Allow-* headers and the browser will block the request.
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true, // allow cookies/Authorization header if used
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware (must be before routes)
app.use(cors(corsOptions));

// Ensure preflight (OPTIONS) requests are handled for all routes

// Body parser
app.use(express.json());

// ------------------
// Register modular routes
// ------------------
registerRoutes(app);

// Simple health / ready endpoint (useful for Render health check)
app.get("/healthz", (req, res) => res.status(200).json({ ok: true }));

// Fallback root
app.get("/", (req, res) => res.send("Backend server is running."));

// Basic error handler (captures unhandled errors and logs them)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  // If CORS returned false for this origin, send 403 so browsers see a proper rejection
  if (err && err.message && err.message.toLowerCase().includes("cors")) {
    return res.status(403).json({ error: "CORS policy: This origin is not allowed." });
  }
  // Generic 500
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
});
