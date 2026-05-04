const app = require("../server");
const connectDB = require("../config/db");

module.exports = async (req, res) => {
  await connectDB();   // 🔥 ensures connection per request (serverless)
  return app(req, res);
};