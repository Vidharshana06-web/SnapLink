const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getAnalytics,
  getAnalyticsSummary,
} = require("../controllers/analyticsController");

router.get("/", protect, getAnalytics);
router.get("/summary", protect, getAnalyticsSummary);

module.exports = router;