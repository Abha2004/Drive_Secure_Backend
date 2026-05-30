require("dotenv").config(); // Reloaded for IPv4 ML API fix
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const routeRoutes = require("./routes/routeRoutes");
const alertRoutes = require("./routes/alertRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Initialize Socket.io
initSocket(server);

// Middleware - CORS and Body Parser
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

// Connect to database
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/route", routeRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/location", locationRoutes);

if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(clientBuildPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.get("/", (req,res) =>{
    res.send("DriveSecure API is running");
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, ()=>{
    console.log(`Server is listening on port:${PORT}`);
});