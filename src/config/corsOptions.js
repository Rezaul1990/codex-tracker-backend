const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:5001"];

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...(configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins),
    process.env.API_URL,
  ].filter(Boolean)),
);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

module.exports = corsOptions;
