const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createShortUrl,
  bulkCreateShortUrls,
  editUrl,
  getUserUrls,
  deleteUrl,
} = require("../controllers/urlController");

router.post("/create", protect, createShortUrl);

router.post("/bulk", protect, bulkCreateShortUrls);

router.put("/:id", protect, editUrl);

router.get("/", protect, getUserUrls);

router.delete("/:id", protect, deleteUrl);

module.exports = router;