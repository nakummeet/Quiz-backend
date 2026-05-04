const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error.message);
    // ❌ REMOVE process.exit
  }
};

module.exports = connectDB;