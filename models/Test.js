const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
