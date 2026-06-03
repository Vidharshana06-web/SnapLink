const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Url",
      required: true,
    },

    browser: {
      type: String,
      default: "Unknown",
    },

    device: {
      type: String,
      default: "Unknown",
    },

    location: {
      type: String,
      default: "Unknown",
    },

    country: {
      type: String,
      default: "Unknown",
    },

    city: {
      type: String,
      default: "Unknown",
    },

    region: {
      type: String,
      default: "Unknown",
    },

    visitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance indexes for scaling queries
analyticsSchema.index({ urlId: 1 });
analyticsSchema.index({ visitedAt: -1 });
analyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);