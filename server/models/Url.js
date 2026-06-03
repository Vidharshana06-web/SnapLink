const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalUrl: {
      type: String,
      required: true,
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      trim: true,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    clickCount: {
      type: Number,
      default: 0,
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Url", urlSchema);