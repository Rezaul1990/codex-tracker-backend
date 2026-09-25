const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

const trackerRoutes = require("./routes/trackerRoutes");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Codex Tracker System API is running",
    endpoints: ["/health", "/api/trackers"],
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/trackers", trackerRoutes);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
