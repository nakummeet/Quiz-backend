const mongoose = require("mongoose");
const Test = require("../models/Test");
const Question = require("../models/Question");

/// ➤ Create Test
const createTest = async (req, res) => {
  try {
    const { title, topic, totalQuestions } = req.body;

    if (!title || !topic || !totalQuestions) {
      return res.status(400).json({
        message: "title, topic and totalQuestions are required",
      });
    }

    const test = await Test.create({ title, topic, totalQuestions });

    res.status(201).json({
      message: "Test created",
      data: test,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/// ➤ Get all tests (FIXED)
const getTests = async (req, res) => {
  try {
    const { topic } = req.query;

    let filter = {};

    // 🔥 FIX: filter by topic if provided
    if (topic) {
      filter.topic = topic;
    }

    const tests = await Test.find(filter).sort({ createdAt: -1 });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/// ➤ Get test with questions
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(id),
    });

    res.json({
      test,
      questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTest,
  getTests,
  getTestById,
};