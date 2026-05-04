const mongoose = require("mongoose");
const Question = require("../models/Question");
const Test = require("../models/Test");

/// ➤ Add questions linked to a test
const addQuestions = async (req, res) => {
  try {
    const { testId, questions } = req.body;

    // 🔹 Basic validation
    if (!testId)
      return res.status(400).json({ message: "testId is required" });

    if (!questions || !Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ message: "questions array is required" });

    if (!mongoose.Types.ObjectId.isValid(testId))
      return res.status(400).json({ message: "Invalid testId format" });

    // 🔹 Check test exists
    const test = await Test.findById(testId);
    if (!test)
      return res.status(404).json({ message: "Test not found" });

    // 🔹 Validate + map questions
    const docs = questions.map((q, index) => {
      if (!q.question)
        throw new Error(`Question text missing at index ${index}`);

      if (!q.options || !Array.isArray(q.options) || q.options.length !== 4)
        throw new Error(`Question at index ${index} must have exactly 4 options`);

      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      )
        throw new Error(`Invalid correctAnswer at index ${index}`);

      return {
        testId: new mongoose.Types.ObjectId(testId),
        topic: test.topic,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        time: q.time ?? 30,
      };
    });

    // 🔹 Insert questions
    const saved = await Question.insertMany(docs);

    res.status(201).json({
      message: "Questions saved",
      count: saved.length,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/// ➤ Submit test — returns score + detailed result
const submitTest = async (req, res) => {
  try {
    const { testId, answers } = req.body;

    // 🔹 Validation
    if (!testId)
      return res.status(400).json({ message: "testId is required" });

    if (!answers || !Array.isArray(answers) || answers.length === 0)
      return res.status(400).json({ message: "answers array is required" });

    if (!mongoose.Types.ObjectId.isValid(testId))
      return res.status(400).json({ message: "Invalid testId format" });

    // 🔹 Fetch questions
    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(testId),
    });

    if (questions.length === 0)
      return res.status(404).json({ message: "No questions found for this test" });

    const totalQuestions = questions.length;

    // 🔥 PERFORMANCE FIX: Create map (O(1) lookup)
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    // 🔥 REMOVE DUPLICATE ANSWERS
    const uniqueAnswers = {};
    answers.forEach((a) => {
      if (a.questionId) {
        uniqueAnswers[a.questionId] = a; // last answer wins
      }
    });

    const cleanAnswers = Object.values(uniqueAnswers);

    let score = 0;

    // 🔹 Process answers
    const result = cleanAnswers.map((ans) => {
      if (!mongoose.Types.ObjectId.isValid(ans.questionId)) return null;

      const q = questionMap[ans.questionId];
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
        selectedText:
          ans.selected === -1 || !q.options[ans.selected]
            ? "Not answered"
            : q.options[ans.selected],
        isCorrect,
      };
    }).filter(Boolean);

    // 🔹 Final response
    res.json({
      testId,
      total: totalQuestions,   // 🔥 FIXED for Flutter
      attempted: cleanAnswers.length,
      score,
      percentage: Math.round((score / totalQuestions) * 100),
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addQuestions,
  submitTest,
};