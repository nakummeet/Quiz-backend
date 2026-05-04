const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/question", require("./routes/questionRoutes"));

app.get("/", (req, res) => res.send("API Running..."));

app.use(errorHandler);

// ❌ REMOVE THIS
// app.listen(5000, () => console.log("Server running on port 5000"));

module.exports = app; // ✅ ADD THIS