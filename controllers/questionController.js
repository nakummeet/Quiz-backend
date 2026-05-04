const mongoose = require("mongoose");
const Question = require("../models/Question");
const Test = require("../models/Test");

// ➤ Add questions linked to a test
const addQuestions = async (req, res) => {
  try {
    const { testId, questions } = req.body;

    if (!testId)
      return res.status(400).json({ message: "testId is required" });

    if (!questions || !Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ message: "questions array is required" });

    if (!mongoose.Types.ObjectId.isValid(testId))
      return res.status(400).json({ message: "Invalid testId format" });

    const test = await Test.findById(testId);
    if (!test)
      return res.status(404).json({ message: "Test not found" });

    const docs = questions.map((q) => ({
      testId: new mongoose.Types.ObjectId(testId),
      topic: test.topic,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      time: q.time ?? 30,
    }));

    const saved = await Question.insertMany(docs);

    res.status(201).json({ message: "Questions saved", count: saved.length, data: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Submit test — returns score + full result per question
const submitTest = async (req, res) => {
  try {
    const { testId, answers } = req.body;

    if (!testId)
      return res.status(400).json({ message: "testId is required" });

    if (!answers || !Array.isArray(answers) || answers.length === 0)
      return res.status(400).json({ message: "answers array is required" });

    if (!mongoose.Types.ObjectId.isValid(testId))
      return res.status(400).json({ message: "Invalid testId format" });

    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(testId),
    });

    if (questions.length === 0)
      return res.status(404).json({ message: "No questions found for this test" });

    let score = 0;

    const result = answers.map((ans) => {
      if (!mongoose.Types.ObjectId.isValid(ans.questionId)) return null;

      const q = questions.find((q) => q._id.toString() === ans.questionId);
      if (!q) return null;

      const isCorrect = q.correctAnswer === ans.selected;
      if (isCorrect) score++;

      return {
        questionId: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.options[q.correctAnswer],
        selected: ans.selected,
        selectedText: ans.selected === -1
          ? "Not answered"
          : q.options[ans.selected] ?? "Not answered",
        isCorrect,
      };
    }).filter(Boolean);

    res.json({
      testId,
      totalQuestions: questions.length,
      attempted: answers.length,
      score,
      percentage: Math.round((score / questions.length) * 100),
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addQuestions, submitTest };
