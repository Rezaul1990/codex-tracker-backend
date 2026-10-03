const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const corsOptions = require("./config/corsOptions");
const { ensureDatabaseConnection } = require("./middleware/databaseMiddleware");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { validateAuthEnv } = require("./config/env");
const openApiSpec = require("./docs/openApiSpec");

validateAuthEnv();

const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: {
      requestInterceptor: (request) => {
        request.credentials = "include";
        return request;
      },
    },
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "Codex Tracker System API is running",
    endpoints: [
      "/health",
      "/api-docs",
      "/api-docs.json",
      "/api/auth",
      "/api/dashboard",
      "/api/notifications",
      "/api/projects",
      "/api/tasks",
    ],
  });
});

app.get("/api-docs.json", (req, res) => {
  res.json(openApiSpec);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", ensureDatabaseConnection);
app.use("/api/auth", authRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
