const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const corsOptions = require("./config/corsOptions");
const { ensureDatabaseConnection } = require("./middleware/databaseMiddleware");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const { validateAuthEnv } = require("./config/env");
const openApiSpec = require("./docs/openApiSpec");

validateAuthEnv();

const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
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
    endpoints: ["/health", "/api-docs", "/api-docs.json", "/api/auth", "/api/projects"],
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
app.use("/api/projects", projectRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
