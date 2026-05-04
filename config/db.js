const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((mongoose) => {
      console.log("MongoDB Connected");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;