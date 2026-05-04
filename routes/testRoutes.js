const express = require("express");
const router = express.Router();
const { createTest, getTests, getTestById } = require("../controllers/testController");

router.post("/create", createTest);      // POST /api/test/create
router.get("/", getTests);               // GET  /api/test
router.get("/:id", getTestById);         // GET  /api/test/:id  (with questions)

module.exports = router;
