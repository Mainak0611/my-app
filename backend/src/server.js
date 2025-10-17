// backend/src/server.js (FINAL Modular Setup)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// 🛑 UPDATED: Import the global route registration function
import registerRoutes from "./routes.js"; 

dotenv.config(); 
const app = express();

// 1. CORS Middleware 
app.use(
  cors({
    origin: "http://localhost:5173",
    // Ensure PATCH method is included
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// 2. Define Routes using the global route registration
// 🛑 NEW: Call the function to register all module routes 🛑
registerRoutes(app); 

// 3. Fallback/Test Route (Optional - Keep for general server check)
app.get('/', (req, res) => {
    res.send("Backend server is running.");
});

// 4. Start server (Use the port defined by .env or 5001)
const PORT = process.env.PORT || 5001; 
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));