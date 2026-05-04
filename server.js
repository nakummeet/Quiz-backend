const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/question", require("./routes/questionRoutes"));

app.get("/", (req, res) => res.send("API Running..."));

app.use(errorHandler);

// 🔥 IMPORTANT: wait for DB before starting server (local)
const startServer = async () => {
  try {
    await connectDB(); // <-- wait here
    app.listen(5000, () => console.log("Server running on port 5000"));
  } catch (err) {
    console.error("Server start error:", err);
  }
};

// Only run locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  startServer();
}

module.exports = app; // for Vercel