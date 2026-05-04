# AIBridge — backend
> Generated on 5/5/2026, 1:17:08 AM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors

## 🔌 API Endpoints

**/question**
- `POST` `/question/questions` → addQuestions
- `POST` `/question/submit` → submitTest

**/test**
- `POST` `/test/create` → createTest
- `GET` `/test` → getTests
- `GET` `/test/:id` → getTestById

## 🔄 Business Flow

Client sends request → Middleware validates → Controller processes → Response returned

## ⭐ Important Files

| File | Role | Purpose |
|---|---|---|
| `server.js` | Entry Point | App entry — initializes Express, loads middleware, connects DB, starts server |
| `index.js` | App Root | Registers all routes and global middleware onto the Express app |
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `testController.js` | Controller | Handles business logic for testjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `testRoutes.js` | Router | Maps HTTP endpoints to testRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |

## 🔗 Dependency Insights

- **questionController.js** — Needs Question, Test to read/write data and send responses
- **testController.js** — Needs Test, Question to read/write data and send responses
- **questionRoutes.js** — Connects HTTP endpoints to questionController
- **testRoutes.js** — Connects HTTP endpoints to testController

## 🛠 Tech Stack

- **Language:** JavaScript, JavaScript
- **Backend:** Express.js
- **Database:** MongoDB (Mongoose)

## 📎 Selected Files — Full Code

### api/index.js  _(7 lines)_
```javascript
const app = require("../server");
const connectDB = require("../config/db");

module.exports = async (req, res) => {
  await connectDB();   // 🔥 ensures connection per request (serverless)
  return app(req, res);
};
```

### config/db.js  _(21 lines)_
```javascript
const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  }

  const db = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = db.connections[0].readyState;
  console.log("MongoDB Connected");
};

module.exports = connectDB;
```

### controllers/questionController.js  _(100 lines)_
```javascript
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

```

### controllers/testController.js  _(79 lines)_
```javascript
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
```

### middlewares/errorMiddleware.js  _(7 lines)_
```javascript
const errorHandler = (err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message || "Server Error" });
};

module.exports = { errorHandler };

```

### models/Question.js  _(35 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [arr => arr.length === 4, "Must have 4 options"],
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  time: {
    type: Number,
    default: 30,
  },
});

module.exports = mongoose.model("Question", questionSchema);

```

### models/Test.js  _(13 lines)_
```javascript
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

```

### routes/questionRoutes.js  _(9 lines)_
```javascript
const express = require("express");
const router = express.Router();
const { addQuestions, submitTest } = require("../controllers/questionController");

router.post("/questions", addQuestions);  // POST /api/question/questions
router.post("/submit", submitTest);       // POST /api/question/submit

module.exports = router;

```

### routes/testRoutes.js  _(10 lines)_
```javascript
const express = require("express");
const router = express.Router();
const { createTest, getTests, getTestById } = require("../controllers/testController");

router.post("/create", createTest);      // POST /api/test/create
router.get("/", getTests);               // GET  /api/test
router.get("/:id", getTestById);         // GET  /api/test/:id  (with questions)

module.exports = router;

```

> ⚠️ Skipped `aiprompt.md` — file too large (over 50KB)

### package.json  _(10 lines)_
```json
{
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "mongoose": "^9.6.1",
    "nodemon": "^3.1.14"
  }
}

```

### README.md  _(3 lines)_
```markdown
# Quiz-backend
test your level

```

### server.js  _(36 lines)_
```javascript
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
```

## 🕐 Recent Git Activity

- `a010972` | Nakum Meet | 3 minutes ago | fix versal bug
- `f39b7d0` | Nakum Meet | 16 minutes ago | fix topic filter
- `6953604` | Nakum Meet | 62 minutes ago | fix db connection for vercel
- `c492d50` | Nakum Meet | 71 minutes ago | remove node_modules and env
- `9bcdabc` | Nakum Meet | 76 minutes ago | fix vercel path
- `0d96625` | Nakum Meet | 88 minutes ago | merge fix
- `e879e1d` | Nakum Meet | 2 hours ago | deploy backend
- `52aa7ed` | Meet Nakum | 2 hours ago | Initial commit

---
_Generated by AIBridge — 📄 Full Code mode_