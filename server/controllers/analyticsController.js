const Analytics = require("../models/Analytics");
const Url = require("../models/Url");
const mongoose = require("mongoose");

const getAnalytics = async (req, res) => {
  try {
    const urls = await Url.find({
      userId: req.user.id,
    });

    const urlIds = urls.map((url) => url._id);

    const analytics = await Analytics.find({
      urlId: { $in: urlIds },
    }).sort({ createdAt: -1 });

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAnalyticsSummary = async (req, res) => {
  try {
    const { urlId, days } = req.query;
    const urls = await Url.find({ userId: req.user.id }).select("_id").lean();
    const urlIds = urls.map((url) => url._id);

    if (urlIds.length === 0) {
      return res.status(200).json({
        totalClicks: 0,
        browserBreakdown: [],
        deviceBreakdown: [],
        dailyCounts: [],
      });
    }

    const match = { urlId: { $in: urlIds } };

    if (urlId && urlId !== "all" && mongoose.Types.ObjectId.isValid(urlId)) {
      const selectedId = mongoose.Types.ObjectId(urlId);
      const belongsToUser = urlIds.some((id) => id.equals(selectedId));
      match.urlId = belongsToUser ? selectedId : mongoose.Types.ObjectId("000000000000000000000000");
    }

    if (days && Number(days) !== 99) {
      const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      match.visitedAt = { $gte: cutoff };
    }

    const [result] = await Analytics.aggregate([
      { $match: match },
      {
        $facet: {
          totalClicks: [{ $count: "count" }],
          browserBreakdown: [
            {
              $group: {
                _id: { $ifNull: ["$browser", "Other"] },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                name: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$_id", ""] },
                        { $eq: ["$_id", null] },
                        { $eq: ["$_id", "Unknown"] },
                      ],
                    },
                    "Other",
                    "$_id",
                  ],
                },
                count: 1,
              },
            },
            { $sort: { count: -1, name: 1 } },
          ],
          deviceBreakdown: [
            {
              $group: {
                _id: { $ifNull: ["$device", "Unknown"] },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                name: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$_id", ""] },
                        { $eq: ["$_id", null] },
                        { $eq: ["$_id", "Unknown"] },
                      ],
                    },
                    "Unknown",
                    "$_id",
                  ],
                },
                count: 1,
              },
            },
            { $sort: { count: -1, name: 1 } },
          ],
          dailyCounts: [
            {
              $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
              },
            },
            {
              $group: {
                _id: "$date",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    const totalClicks = result?.totalClicks?.[0]?.count || 0;
    const browserCategories = ["Chrome", "Edge", "Firefox", "Safari", "Opera", "Brave", "Other"];
    const deviceCategories = ["Desktop", "Mobile", "Tablet", "Unknown"];

    const browserBreakdown = browserCategories.map((name) => {
      const found = result?.browserBreakdown?.find((item) => item.name === name);
      return { name, count: found ? found.count : 0 };
    });

    const deviceBreakdown = deviceCategories.map((name) => {
      const found = result?.deviceBreakdown?.find((item) => item.name === name);
      return { name, count: found ? found.count : 0 };
    });

    res.status(200).json({
      totalClicks,
      browserBreakdown,
      deviceBreakdown,
      dailyCounts: result?.dailyCounts || [],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAnalytics,
  getAnalyticsSummary,
};