const express = require("express");
const router = express.Router();
const { addQuestions, submitTest } = require("../controllers/questionController");

router.post("/questions", addQuestions);  // POST /api/question/questions
router.post("/submit", submitTest);       // POST /api/question/submit

module.exports = router;
