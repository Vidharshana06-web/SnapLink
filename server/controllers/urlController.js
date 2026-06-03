const Url = require("../models/Url");
const generateShortCode = require("../utils/generateShortCode");
const Analytics = require("../models/Analytics");
const geoip = require("geoip-lite");

// Create Short URL
const createShortUrl = async (req, res) => {
  try {
    const { originalUrl, customShortCode, title, expiresAt } = req.body;

    let shortCode = customShortCode ? customShortCode.trim() : "";
    let expiresAtDate = null;

    if (expiresAt) {
      const parsedExpiry = new Date(expiresAt);
      if (Number.isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ message: "Expiration date is invalid." });
      }
      if (parsedExpiry <= new Date()) {
        return res.status(400).json({ message: "Expiration date must be in the future." });
      }
      expiresAtDate = parsedExpiry;
    }

    if (shortCode) {
      // Validate unique custom short code
      const existing = await Url.findOne({ shortCode });
      if (existing) {
        return res.status(400).json({
          message: "Custom short code is already taken.",
        });
      }
    } else {
      shortCode = generateShortCode();
      // Ensure generated code is unique (rare collision)
      let existing = await Url.findOne({ shortCode });
      while (existing) {
        shortCode = generateShortCode();
        existing = await Url.findOne({ shortCode });
      }
    }

    const newUrl = await Url.create({
      userId: req.user.id,
      originalUrl,
      shortCode,
      title: title?.trim() || undefined,
      expiresAt: expiresAtDate,
    });

    res.status(201).json({
      message: "Short URL Created",
      data: newUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Bulk Create Short URLs
const bulkCreateShortUrls = async (req, res) => {
  try {
    const { urls } = req.body; // Expects array of strings: ["http://google.com", "http://github.com"]
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        message: "Invalid bulk URLs array.",
      });
    }

    const createdUrls = [];

    for (let originalUrl of urls) {
      originalUrl = originalUrl.trim();
      if (!originalUrl) continue;

      let shortCode = generateShortCode();
      let existing = await Url.findOne({ shortCode });
      while (existing) {
        shortCode = generateShortCode();
        existing = await Url.findOne({ shortCode });
      }

      const newUrl = await Url.create({
        userId: req.user.id,
        originalUrl,
        shortCode,
      });
      createdUrls.push(newUrl);
    }

    res.status(201).json({
      message: `${createdUrls.length} URLs shortened successfully.`,
      data: createdUrls,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Edit URL
const editUrl = async (req, res) => {
  try {
    const { originalUrl, title, expiresAt } = req.body;
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        message: "URL not found",
      });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (originalUrl) {
      url.originalUrl = originalUrl;
    }

    if (typeof title !== "undefined") {
      url.title = title?.trim() || null;
    }

    if (expiresAt !== undefined) {
      if (expiresAt === "" || expiresAt === null) {
        url.expiresAt = null;
      } else {
        const parsedExpiry = new Date(expiresAt);
        if (Number.isNaN(parsedExpiry.getTime())) {
          return res.status(400).json({ message: "Expiration date is invalid." });
        }
        if (parsedExpiry <= new Date()) {
          return res.status(400).json({ message: "Expiration date must be in the future." });
        }
        url.expiresAt = parsedExpiry;
      }
    }

    await url.save();

    res.status(200).json({
      message: "URL Updated Successfully",
      data: url,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get User URLs
const getUserUrls = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user.id };

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { originalUrl: searchRegex },
        { shortCode: searchRegex },
        { title: searchRegex },
      ];
    }

    const urls = await Url.find(filter).sort({ createdAt: -1 });

    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete URL
const deleteUrl = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        message: "URL not found",
      });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await Url.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "URL Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Redirect URL
const redirectUrl = async (req, res) => {
  try {
    const url = await Url.findOne({
      shortCode: req.params.shortCode,
    });

    if (!url) {
      return res.status(404).json({
        message: "Short URL Not Found",
      });
    }

    if (url.expiresAt && new Date() > url.expiresAt) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      if (req.accepts("html")) {
        return res.redirect(`${frontendUrl}/expired`);
      }
      return res.status(410).json({ message: "Short URL has expired." });
    }

    url.clickCount += 1;
    url.lastActivityAt = new Date();
    await url.save();

    const userAgent = req.headers["user-agent"] || "";

    let browser = "Other";
    let device = "Desktop";

    // Ordered check to avoid false positives (many browsers contain Chrome/Safari tokens)
    if (/edg(e|a|i)?\//i.test(userAgent) || /edge\//i.test(userAgent)) {
      browser = "Edge";
    } else if (/opr\/|opera/i.test(userAgent)) {
      browser = "Opera";
    } else if (/brave/i.test(userAgent)) {
      browser = "Brave";
    } else if (/firefox|fxios/i.test(userAgent)) {
      browser = "Firefox";
    } else if (/chrome|crios/i.test(userAgent) && !/edg|edge|opr|opera|brave/i.test(userAgent)) {
      browser = "Chrome";
    } else if (/safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent)) {
      browser = "Safari";
    } else {
      browser = "Other";
    }

    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      device = "Tablet";
    } else if (/mobile|android|iphone|ipod|blackberry|bb10|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
      device = "Mobile";
    }

    // Geolocation Resolution
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket?.remoteAddress || req.ip || "";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    if (ip === "::1" || ip === "127.0.0.1" || ip.includes("::ffff:127.0.0.1")) {
      ip = "8.8.8.8";
    }

    const geo = geoip.lookup(ip);
    let country = "Unknown";
    let city = "Unknown";
    let region = "Unknown";
    let location = "Unknown";

    if (geo) {
      country = geo.country || "Unknown";
      city = geo.city || "Unknown";
      region = geo.region || "Unknown";
      location = [city, region, country].filter((v) => v && v !== "Unknown").join(", ") || "Unknown";
    }

    await Analytics.create({
      urlId: url._id,
      browser,
      device,
      location,
      country,
      city,
      region,
      visitedAt: new Date(),
    });

    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createShortUrl,
  bulkCreateShortUrls,
  editUrl,
  getUserUrls,
  deleteUrl,
  redirectUrl,
};