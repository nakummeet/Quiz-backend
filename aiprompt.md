# AIBridge — backend
> Generated on 5/4/2026, 11:36:36 PM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors
- **Models** — Define database schemas and interact with the database
- **Utils** — Shared helpers — token generation, response formatting, etc.

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
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `testController.js` | Controller | Handles business logic for testjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `testRoutes.js` | Router | Maps HTTP endpoints to testRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |
| `questionModel.js` | Model | Defines questionModel database schema and shape |

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

### config/db.js  _(13 lines)_
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
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

### controllers/testController.js  _(54 lines)_
```javascript
const mongoose = require("mongoose");
const Test = require("../models/Test");
const Question = require("../models/Question");

// ➤ Create Test
const createTest = async (req, res) => {
  try {
    const { title, topic, totalQuestions } = req.body;

    if (!title || !topic || !totalQuestions)
      return res.status(400).json({ message: "title, topic and totalQuestions are required" });

    const test = await Test.create({ title, topic, totalQuestions });
    res.status(201).json({ message: "Test created", data: test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all tests
const getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get single test with its questions
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid test ID" });

    const test = await Test.findById(id);
    if (!test)
      return res.status(404).json({ message: "Test not found" });

    // fix: cast id to ObjectId so it matches testId in questions collection
    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(id),
    });

    res.json({ test, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById };

```

### data/questions.js  _(26 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  topic: { type: String, required: true },
  question: { type: String, required: true },
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
  time: { type: Number, default: 30 },
});

module.exports = mongoose.model("Question", questionSchema);

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

### models/questionModel.js  _(1 lines)_
```javascript

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

### utils/helpers.js  _(1 lines)_
```javascript

```

### aiprompt.md  _(1451 lines)_
```markdown
# AIBridge — backend
> Generated on 5/4/2026, 11:36:35 PM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors
- **Models** — Define database schemas and interact with the database
- **Utils** — Shared helpers — token generation, response formatting, etc.

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
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `testController.js` | Controller | Handles business logic for testjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `testRoutes.js` | Router | Maps HTTP endpoints to testRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |
| `questionModel.js` | Model | Defines questionModel database schema and shape |

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

### config/db.js  _(13 lines)_
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
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

### controllers/testController.js  _(54 lines)_
```javascript
const mongoose = require("mongoose");
const Test = require("../models/Test");
const Question = require("../models/Question");

// ➤ Create Test
const createTest = async (req, res) => {
  try {
    const { title, topic, totalQuestions } = req.body;

    if (!title || !topic || !totalQuestions)
      return res.status(400).json({ message: "title, topic and totalQuestions are required" });

    const test = await Test.create({ title, topic, totalQuestions });
    res.status(201).json({ message: "Test created", data: test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all tests
const getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get single test with its questions
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid test ID" });

    const test = await Test.findById(id);
    if (!test)
      return res.status(404).json({ message: "Test not found" });

    // fix: cast id to ObjectId so it matches testId in questions collection
    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(id),
    });

    res.json({ test, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById };

```

### data/questions.js  _(26 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  topic: { type: String, required: true },
  question: { type: String, required: true },
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
  time: { type: Number, default: 30 },
});

module.exports = mongoose.model("Question", questionSchema);

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

### models/questionModel.js  _(1 lines)_
```javascript

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

### utils/helpers.js  _(1 lines)_
```javascript

```

### aiprompt.md  _(1027 lines)_
```markdown
# AIBridge — backend
> Generated on 5/4/2026, 4:50:50 PM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors
- **Models** — Define database schemas and interact with the database
- **Utils** — Shared helpers — token generation, response formatting, etc.

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
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `testController.js` | Controller | Handles business logic for testjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `testRoutes.js` | Router | Maps HTTP endpoints to testRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |
| `questionModel.js` | Model | Defines questionModel database schema and shape |

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

### config/db.js  _(13 lines)_
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
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

### controllers/testController.js  _(54 lines)_
```javascript
const mongoose = require("mongoose");
const Test = require("../models/Test");
const Question = require("../models/Question");

// ➤ Create Test
const createTest = async (req, res) => {
  try {
    const { title, topic, totalQuestions } = req.body;

    if (!title || !topic || !totalQuestions)
      return res.status(400).json({ message: "title, topic and totalQuestions are required" });

    const test = await Test.create({ title, topic, totalQuestions });
    res.status(201).json({ message: "Test created", data: test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all tests
const getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get single test with its questions
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid test ID" });

    const test = await Test.findById(id);
    if (!test)
      return res.status(404).json({ message: "Test not found" });

    // fix: cast id to ObjectId so it matches testId in questions collection
    const questions = await Question.find({
      testId: new mongoose.Types.ObjectId(id),
    });

    res.json({ test, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById };

```

### data/questions.js  _(26 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  topic: { type: String, required: true },
  question: { type: String, required: true },
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
  time: { type: Number, default: 30 },
});

module.exports = mongoose.model("Question", questionSchema);

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

### models/questionModel.js  _(1 lines)_
```javascript

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

### utils/helpers.js  _(1 lines)_
```javascript

```

### aiprompt.md  _(603 lines)_
```markdown
# AIBridge — backend
> Generated on 5/4/2026, 4:14:11 PM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors
- **Models** — Define database schemas and interact with the database
- **Utils** — Shared helpers — token generation, response formatting, etc.

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
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `testController.js` | Controller | Handles business logic for testjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `testRoutes.js` | Router | Maps HTTP endpoints to testRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |
| `questionModel.js` | Model | Defines questionModel database schema and shape |

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

### config/db.js  _(13 lines)_
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### controllers/questionController.js  _(51 lines)_
```javascript
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

    // make sure test exists
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const docs = questions.map((q) => ({ ...q, testId, topic: test.topic }));
    const saved = await Question.insertMany(docs);

    res.status(201).json({ message: "Questions saved", data: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Submit test — returns score
const submitTest = async (req, res) => {
  try {
    const { testId, answers } = req.body;

    if (!answers || !Array.isArray(answers))
      return res.status(400).json({ message: "answers array is required" });

    const questions = await Question.find({ testId });
    let score = 0;

    answers.forEach((ans) => {
      const q = questions.find((q) => q._id.toString() === ans.id);
      if (q && q.correctAnswer === ans.selected) score++;
    });

    res.json({ total: answers.length, score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addQuestions, submitTest };

```

### controllers/testController.js  _(45 lines)_
```javascript
const Test = require("../models/Test");
const Question = require("../models/Question");

// ➤ Create Test
const createTest = async (req, res) => {
  try {
    const { title, topic, totalQuestions } = req.body;

    if (!title || !topic || !totalQuestions)
      return res.status(400).json({ message: "title, topic and totalQuestions are required" });

    const test = await Test.create({ title, topic, totalQuestions });

    res.status(201).json({ message: "Test created", data: test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all tests
const getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get single test with its questions
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const questions = await Question.find({ testId: req.params.id });

    res.json({ test, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, getTests, getTestById };

```

### data/questions.js  _(3 lines)_
```javascript
// let questions = [];

// module.exports = questions;
```

### middlewares/errorMiddleware.js  _(7 lines)_
```javascript
const errorHandler = (err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message || "Server Error" });
};

module.exports = { errorHandler };

```

### models/Question.js  _(29 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
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

### models/questionModel.js  _(1 lines)_
```javascript

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

### utils/helpers.js  _(1 lines)_
```javascript

```

### aiprompt.md  _(266 lines)_
```markdown
# AIBridge — backend
> Generated on 5/4/2026, 3:50:16 PM  |  Mode: 📄 Full Code
> Paste into ChatGPT, Claude, Gemini, or any AI tool.

---

## 📋 Project Overview

**backend** is a backend API built with Express.js and MongoDB (Mongoose).

**backend** is a backend REST API built with Express.js and MongoDB (Mongoose).

## 🏗 Core Architecture

- **Routes** — Define HTTP endpoints and map them to controller functions
- **Controllers** — Handle request logic — validate input, call models, return responses
- **Middleware** — Intercept requests — handle auth, roles, validation, errors
- **Models** — Define database schemas and interact with the database
- **Utils** — Shared helpers — token generation, response formatting, etc.

## 🔌 API Endpoints

**/question**
- `POST` `/question/questions` → addQuestion
- `GET` `/question/questions` → getQuestions
- `POST` `/question/submit` → submitTest

## 🔄 Business Flow

Client sends request → Middleware validates → Controller processes → Response returned

## ⭐ Important Files

| File | Role | Purpose |
|---|---|---|
| `server.js` | Entry Point | App entry — initializes Express, loads middleware, connects DB, starts server |
| `db.js` | Database | Manages database connection — called once at startup |
| `questionController.js` | Controller | Handles business logic for questionjs operations |
| `questionRoutes.js` | Router | Maps HTTP endpoints to questionRoutesjs controller functions |
| `errorMiddleware.js` | Middleware | Intercepts requests — handles errors globally |
| `questionModel.js` | Model | Defines questionModel database schema and shape |

## 🔗 Dependency Insights

- **questionController.js** — Needs Question to read/write data and send responses
- **questionRoutes.js** — Connects HTTP endpoints to questionController

## 🛠 Tech Stack

- **Language:** JavaScript, JavaScript
- **Backend:** Express.js
- **Database:** MongoDB (Mongoose)

## 📎 Selected Files — Full Code

### controllers/questionController.js  _(70 lines)_
```javascript
// const Question = require("../models/Question");

// // ➤ Add Question
// const addQuestion = async (req, res) => {
//   try {
//     const { topic, question, options, correctAnswer, time } = req.body;

//     const newQuestion = await Question.create({
//       topic,
//       question,
//       options,
//       correctAnswer,
//       time,
//     });

//     res.status(201).json({
//       message: "Question added",
//       data: newQuestion,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ➤ Get Questions
// const getQuestions = async (req, res) => {
//   try {
//     const { topic } = req.query;

//     const filter = topic ? { topic } : {};

//     const questions = await Question.find(filter);

//     res.json(questions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ➤ Submit Test
// const submitTest = async (req, res) => {
//   try {
//     const { answers } = req.body;

//     const questions = await Question.find();

//     let score = 0;

//     answers.forEach((ans) => {
//       const q = questions.find(q => q._id.toString() === ans.id);

//       if (q && q.correctAnswer === ans.selected) {
//         score++;
//       }
//     });

//     res.json({
//       total: answers.length,
//       score,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   addQuestion,
//   getQuestions,
//   submitTest,
// };
```

### data/questions.js  _(3 lines)_
```javascript
// let questions = [];

// module.exports = questions;
```

### routes/questionRoutes.js  _(15 lines)_
```javascript
// const express = require("express");
// const router = express.Router();

// const {
//   addQuestion,
//   getQuestions,
//   submitTest,
// } = require("../controllers/questionController");

// // ➤ Routes
// router.post("/questions", addQuestion);
// router.get("/questions", getQuestions); // now supports ?topic=OOP
// router.post("/submit", submitTest);

// module.exports = router;
```

### server.js  _(26 lines)_
```javascript
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

const testRoutes = require("./routes/testRoutes");

app.use("/api", testRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
```

### config/db.js  _(13 lines)_
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### middlewares/errorMiddleware.js  _(1 lines)_
```javascript

```

### models/Question.js  _(29 lines)_
```javascript
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
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

### models/questionModel.js  _(1 lines)_
```javascript

```

### utils/helpers.js  _(1 lines)_
```javascript

```

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

---
_Generated by AIBridge — 📄 Full Code mode_
```

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

### server.js  _(24 lines)_
```javascript
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

app.listen(5000, () => console.log("Server running on port 5000"));

```

---
_Generated by AIBridge — 📄 Full Code mode_
```

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

### server.js  _(24 lines)_
```javascript
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

app.listen(5000, () => console.log("Server running on port 5000"));

```

---
_Generated by AIBridge — 📄 Full Code mode_
```

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

### server.js  _(24 lines)_
```javascript
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

app.listen(5000, () => console.log("Server running on port 5000"));

```

---
_Generated by AIBridge — 📄 Full Code mode_
```

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

### server.js  _(24 lines)_
```javascript
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

app.listen(5000, () => console.log("Server running on port 5000"));

```

---
_Generated by AIBridge — 📄 Full Code mode_