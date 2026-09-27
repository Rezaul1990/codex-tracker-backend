const app = require("./app");
const connectDB = require("./config/db");
const port = process.env.PORT || 5001;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
