import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./Analytics.css";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const Analytics = () => {
  const [searchParams] = useSearchParams();
  const targetUrlId = searchParams.get("id");

  const [urls, setUrls] = useState([]);
  const [summary, setSummary] = useState({
    totalClicks: 0,
    browserBreakdown: [],
    deviceBreakdown: [],
    dailyCounts: [],
  });
  const [rawAnalytics, setRawAnalytics] = useState([]);
  const [chartFilter, setChartFilter] = useState("Week");
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUrlId, setSelectedUrlId] = useState(targetUrlId || "all");
  const [selectedDays, setSelectedDays] = useState(7); // 1 (24h) | 7 | 30 | 99 (All time)

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedUrlId, selectedDays]);

  useEffect(() => {
    if (targetUrlId && urls.length > 0) {
      setSelectedUrlId(targetUrlId);
    }
  }, [targetUrlId, urls]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = {
        days: selectedDays,
      };
      if (selectedUrlId !== "all") {
        params.urlId = selectedUrlId;
      }

      const [urlsRes, summaryRes, rawRes] = await Promise.all([
        API.get("/url"),
        API.get("/analytics/summary", { params }),
        API.get("/analytics"),
      ]);
      setUrls(urlsRes.data);
      setSummary(summaryRes.data);
      setRawAnalytics(rawRes.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Filter logs by URL ID
  const filteredLogs = selectedUrlId === "all"
    ? rawAnalytics
    : rawAnalytics.filter((log) => log.urlId === selectedUrlId);

  // Get logs filtered by local chart filter
  const getLogsForChartFilter = () => {
    const now = new Date();
    if (chartFilter === "Today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return filteredLogs.filter((log) => {
        const d = new Date(log.visitedAt || log.createdAt);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (chartFilter === "Week") {
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      return filteredLogs.filter((log) => {
        const d = new Date(log.visitedAt || log.createdAt);
        return d >= cutoff;
      });
    } else if (chartFilter === "Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return filteredLogs.filter((log) => {
        const d = new Date(log.visitedAt || log.createdAt);
        return d >= startOfMonth && d <= endOfMonth;
      });
    } else if (chartFilter === "Year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return filteredLogs.filter((log) => {
        const d = new Date(log.visitedAt || log.createdAt);
        return d >= startOfYear && d <= endOfYear;
      });
    }
    // "All Time"
    return filteredLogs;
  };

  const periodLogs = getLogsForChartFilter();

  const getPeriodSummaryStats = () => {
    const totalClicks = periodLogs.length;
    const uniqueVisitors = new Set(
      periodLogs.map((log) => `${log.browser}-${log.device}-${log.location}`)
    ).size;
    const mobileCount = periodLogs.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
    const desktopCount = periodLogs.filter((log) => log.device === "Desktop").length;

    return {
      totalClicks,
      uniqueVisitors,
      mobileCount,
      desktopCount,
    };
  };

  const periodStats = getPeriodSummaryStats();

  const generateChartData = () => {
    const now = new Date();

    if (chartFilter === "Today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const data = [];
      for (let hour = 0; hour < 24; hour++) {
        const bucketStart = new Date(startOfToday);
        bucketStart.setHours(hour, 0, 0, 0);
        const bucketEnd = new Date(startOfToday);
        bucketEnd.setHours(hour, 59, 59, 999);

        const logsInHour = periodLogs.filter((log) => {
          const d = new Date(log.visitedAt || log.createdAt);
          return d >= bucketStart && d <= bucketEnd;
        });

        const uniqueFingerprints = new Set(
          logsInHour.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInHour.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInHour.filter((log) => log.device === "Desktop").length;

        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const label = `${displayHour} ${ampm}`;

        data.push({
          label,
          "Total Clicks": logsInHour.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });
      }
      return data;
    }

    if (chartFilter === "Week") {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const logsInDay = periodLogs.filter((log) => {
          const d = new Date(log.visitedAt || log.createdAt);
          return d >= dayStart && d <= dayEnd;
        });

        const uniqueFingerprints = new Set(
          logsInDay.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInDay.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInDay.filter((log) => log.device === "Desktop").length;

        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        data.push({
          label,
          "Total Clicks": logsInDay.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });
      }
      return data;
    }

    if (chartFilter === "Month") {
      const data = [];
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(year, month, day, 0, 0, 0, 0);
        const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

        const logsInDay = periodLogs.filter((log) => {
          const d = new Date(log.visitedAt || log.createdAt);
          return d >= dayStart && d <= dayEnd;
        });

        const uniqueFingerprints = new Set(
          logsInDay.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInDay.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInDay.filter((log) => log.device === "Desktop").length;

        const label = dayStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        data.push({
          label,
          "Total Clicks": logsInDay.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });
      }
      return data;
    }

    if (chartFilter === "Year") {
      const data = [];
      const year = now.getFullYear();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const logsInMonth = periodLogs.filter((log) => {
          const d = new Date(log.visitedAt || log.createdAt);
          return d >= monthStart && d <= monthEnd;
        });

        const uniqueFingerprints = new Set(
          logsInMonth.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInMonth.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInMonth.filter((log) => log.device === "Desktop").length;

        data.push({
          label: monthNames[month],
          "Total Clicks": logsInMonth.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });
      }
      return data;
    }

    // "All Time"
    if (periodLogs.length === 0) return [];

    // Sort logs by date ascending
    const sortedLogs = [...periodLogs].sort((a, b) => {
      return new Date(a.visitedAt || a.createdAt) - new Date(b.visitedAt || b.createdAt);
    });

    const firstDate = new Date(sortedLogs[0].visitedAt || sortedLogs[0].createdAt);
    const lastDate = new Date(sortedLogs[sortedLogs.length - 1].visitedAt || sortedLogs[sortedLogs.length - 1].createdAt);

    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      const data = [];
      const dateMap = {};

      sortedLogs.forEach((log) => {
        const dateStr = new Date(log.visitedAt || log.createdAt).toISOString().split("T")[0];
        if (!dateMap[dateStr]) dateMap[dateStr] = [];
        dateMap[dateStr].push(log);
      });

      const tempDate = new Date(firstDate);
      tempDate.setHours(0, 0, 0, 0);
      const endDate = new Date(lastDate);
      endDate.setHours(23, 59, 59, 999);

      while (tempDate <= endDate) {
        const dateStr = tempDate.toISOString().split("T")[0];
        const logsInDay = dateMap[dateStr] || [];

        const uniqueFingerprints = new Set(
          logsInDay.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInDay.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInDay.filter((log) => log.device === "Desktop").length;

        data.push({
          label: tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          "Total Clicks": logsInDay.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });

        tempDate.setDate(tempDate.getDate() + 1);
      }
      return data;
    } else {
      const data = [];
      const monthMap = {};

      sortedLogs.forEach((log) => {
        const d = new Date(log.visitedAt || log.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = [];
        monthMap[key].push(log);
      });

      const startYear = firstDate.getFullYear();
      const startMonth = firstDate.getMonth();
      const endYear = lastDate.getFullYear();
      const endMonth = lastDate.getMonth();

      let currentYear = startYear;
      let currentMonth = startMonth;

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
        const logsInMonth = monthMap[key] || [];

        const uniqueFingerprints = new Set(
          logsInMonth.map((log) => `${log.browser}-${log.device}-${log.location}`)
        );
        const mobileCount = logsInMonth.filter((log) => log.device === "Mobile" || log.device === "Tablet").length;
        const desktopCount = logsInMonth.filter((log) => log.device === "Desktop").length;

        data.push({
          label: `${monthNames[currentMonth]} ${currentYear}`,
          "Total Clicks": logsInMonth.length,
          "Unique Visitors": uniqueFingerprints.size,
          "Mobile Traffic": mobileCount,
          "Desktop Traffic": desktopCount,
        });

        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
      return data;
    }
  };

  const chartData = generateChartData();

  const browserCategories = [
    "Chrome",
    "Edge",
    "Firefox",
    "Safari",
    "Opera",
    "Brave",
    "Other",
  ];

  const browserData = browserCategories.map((name) => {
    const entry = summary.browserBreakdown.find((item) => item.name === name);
    const count = entry ? entry.count : 0;
    return {
      name,
      count,
      percentage:
        summary.totalClicks > 0 ? Math.round((count / summary.totalClicks) * 100) : 0,
    };
  });

  const deviceCategories = ["Desktop", "Mobile", "Tablet", "Unknown"];

  const deviceData = deviceCategories.map((name) => {
    const entry = summary.deviceBreakdown.find((item) => item.name === name);
    const count = entry ? entry.count : 0;
    return {
      name,
      count,
      percentage:
        summary.totalClicks > 0 ? Math.round((count / summary.totalClicks) * 100) : 0,
    };
  });

  // List of top URLs
  const getTopUrls = () => {
    return [...urls]
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 5);
  };

  const topUrls = getTopUrls();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-glass-tooltip">
          <div className="tooltip-title">{label}</div>
          <div className="tooltip-list">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-item">
                <span className="tooltip-label">
                  <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="tooltip-value">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render Multi-Line Chart using Recharts
  const renderLineChart = () => {
    return (
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#8e9bb0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#8e9bb0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Total Clicks"
              stroke="#FF4FD8"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey="Unique Visitors"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey="Mobile Traffic"
              stroke="#F97316"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey="Desktop Traffic"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render Donut Browser Chart using Recharts
  const renderDonutChart = () => {
    const activeBrowsers = browserData.filter((b) => b.count > 0);
    const browserColors = {
      Chrome: "#4f46e5",  // Indigo
      Firefox: "#8b5cf6", // Violet
      Safari: "#06b6d4",  // Cyan
      Edge: "#d1409e",    // Blue
      Opera: "#a855f7",   // Purple
      Brave: "#6366f1",   // Light Indigo
      Other: "#64748b",   // Slate
    };

    if (activeBrowsers.length === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No browser logs</span>
        </div>
      );
    }

    return (
      <div className="donut-chart-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ width: "100%", height: 180, position: "relative" }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip
                formatter={(value, name, props) => [`${value} visits (${props.payload.percentage}%)`, name]}
                contentStyle={{
                  background: "#0a0b10",
                  border: "1px solid var(--border-glow)",
                  borderRadius: "var(--radius-sm)",
                  color: "#fff",
                  fontSize: "0.85rem"
                }}
              />
              <Pie
                data={activeBrowsers}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                animationDuration={800}
              >
                {activeBrowsers.map((entry, index) => {
                  const color = browserColors[entry.name] || browserColors.Unknown;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={color}
                      style={{ cursor: "pointer", outline: "none" }}
                      stroke={color}
                      strokeWidth={1}
                      onMouseEnter={(e) => {
                        e.target.setAttribute("stroke-width", "3");
                        e.target.setAttribute("stroke", "#ffffff");
                      }}
                      onMouseLeave={(e) => {
                        e.target.setAttribute("stroke-width", "1");
                        e.target.setAttribute("stroke", color);
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text details */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-light)" }}>{summary.totalClicks}</div>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "-2px" }}>Total Visits</div>
          </div>
        </div>

        {/* Legend */}
        <div className="donut-legend" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 12px", marginTop: "12px", width: "100%" }}>
          {activeBrowsers.map((b, i) => {
            const color = browserColors[b.name] || browserColors.Unknown;
            return (
              <div key={i} className="donut-legend-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                <span className="legend-dot" style={{ backgroundColor: color, width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" }}></span>
                <span className="legend-name" style={{ color: "var(--text-secondary)" }}>{b.name}</span>
                <span className="legend-percentage" style={{ fontWeight: "600", color: "var(--text-primary)" }}>{b.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Horizontal Bar Chart for Device Breakdown using Recharts
  const renderDeviceChart = () => {
    const deviceColors = {
      Desktop: "#7255f6", // Indigo
      Mobile: "#a855f7",  // Violet
      Unknown: "#14b8a6", // Teal
    };

    const activeDevices = deviceData.filter((d) => d.count > 0);

    if (activeDevices.length === 0) {
      return <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px", textAlign: "center" }}>No device logs</div>;
    }

    return (
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={activeDevices} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
            <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value, name, props) => [`${value} visits (${props.payload.percentage}%)`]}
              contentStyle={{
                background: "#0a0b10",
                border: "1px solid var(--border-glow)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "0.85rem"
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
              {activeDevices.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={deviceColors[entry.name] || deviceColors.Unknown} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="app-container fade-in">
      <Sidebar />

      <main className="app-main">
        <Navbar />

        <div className="app-content">
          <div className="analytics-filter-header">
            <div>
              <span className="form-label" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>Filter by Link</span>
              <select
                value={selectedUrlId}
                onChange={(e) => setSelectedUrlId(e.target.value)}
                className="form-input filter-dropdown"
              >
                <option value="all">All Shortened Links</option>
                {urls.map((u) => (
                  <option key={u._id} value={u._id}>
                    snap.lk/{u.shortCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="form-label" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>Time window</span>
              <div className="days-toggle-group">
                <button
                  onClick={() => setSelectedDays(1)}
                  className={`toggle-btn ${selectedDays === 1 ? "active" : ""}`}
                >
                  24H
                </button>
                <button
                  onClick={() => setSelectedDays(7)}
                  className={`toggle-btn ${selectedDays === 7 ? "active" : ""}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setSelectedDays(30)}
                  className={`toggle-btn ${selectedDays === 30 ? "active" : ""}`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setSelectedDays(99)}
                  className={`toggle-btn ${selectedDays === 99 ? "active" : ""}`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            // Loading skeletal block
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
              <div className="skeleton skeleton-card" style={{ height: "260px" }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="skeleton skeleton-card" style={{ height: "200px" }}></div>
                <div className="skeleton skeleton-card" style={{ height: "200px" }}></div>
              </div>
            </div>
          ) : summary.totalClicks === 0 ? (
            // Empty State
            <div className="empty-state" style={{ marginTop: "40px" }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No visits tracked in this range</div>
              <div className="empty-state-text">
                Your selected URL hasn't recorded any click-through entries during this time window. Share the link to trigger redirects.
              </div>
            </div>
          ) : (
            // Analytics visualization
            <div className="analytics-body fade-in">
              {/* Click trend line graph */}
              <div className="analytics-card card chart-trend-card modern-glassmorphic-card">
                <div className="chart-trend-header-row">
                  <div className="chart-header">
                    <h3 className="chart-title">Link Click Traffic</h3>
                    <span className="chart-subtitle">Unique click logs count over time</span>
                  </div>

                  <div className="chart-filter-toggles">
                    {["Today", "Week", "Month", "Year", "All Time"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setChartFilter(filter)}
                        className={`chart-filter-btn ${chartFilter === filter ? "active" : ""}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Summary Cards */}
                <div className="chart-summary-grid">
                  <div className="chart-summary-card total-clicks">
                    <span className="summary-card-label">Total Clicks</span>
                    <span className="summary-card-value">{periodStats.totalClicks}</span>
                  </div>
                  <div className="chart-summary-card unique-visitors">
                    <span className="summary-card-label">Unique Visitors</span>
                    <span className="summary-card-value">{periodStats.uniqueVisitors}</span>
                  </div>
                  <div className="chart-summary-card mobile-traffic">
                    <span className="summary-card-label">Mobile Users</span>
                    <span className="summary-card-value">{periodStats.mobileCount}</span>
                  </div>
                  <div className="chart-summary-card desktop-traffic">
                    <span className="summary-card-label">Desktop Users</span>
                    <span className="summary-card-value">{periodStats.desktopCount}</span>
                  </div>
                </div>

                <div className="chart-body">
                  {renderLineChart()}

                  {/* Modern Legend */}
                  <div className="chart-custom-legend">
                    {[
                      { name: "Total Clicks", color: "#FF4FD8" },
                      { name: "Unique Visitors", color: "#3B82F6" },
                      { name: "Mobile Traffic", color: "#F97316" },
                      { name: "Desktop Traffic", color: "#8B5CF6" },
                    ].map((item, index) => (
                      <div key={index} className="legend-item">
                        <span className="legend-indicator-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom secondary breakdown charts grid */}
              <div className="analytics-grid-split">
                {/* Browser donut */}
                <div className="analytics-card card">
                  <div className="chart-header">
                    <h3 className="chart-title">Browser breakdown</h3>
                    <span className="chart-subtitle">Visitor browser configurations</span>
                  </div>
                  <div className="chart-body" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                    {renderDonutChart()}
                  </div>
                </div>

                {/* Device bars */}
                <div className="analytics-card card">
                  <div className="chart-header">
                    <h3 className="chart-title">Device breakdown</h3>
                    <span className="chart-subtitle">Desktop versus mobile clicks</span>
                  </div>
                  <div className="chart-body bar-chart-body" style={{ marginTop: "20px" }}>
                    {renderDeviceChart()}
                  </div>
                </div>
              </div>

              {/* Top performing links */}
              <div className="analytics-card card top-links-card" style={{ marginTop: "24px" }}>
                <div className="chart-header" style={{ marginBottom: "16px" }}>
                  <h3 className="chart-title">Top Performing Short Links</h3>
                  <span className="chart-subtitle">Most active links in your workspace</span>
                </div>
                <div className="top-links-list">
                  {topUrls.map((url, i) => (
                    <div key={url._id} className="top-link-row">
                      <div className="top-link-rank">#{i + 1}</div>
                      <div className="top-link-details">
                        <span className="top-link-short">snap.lk/{url.shortCode}</span>
                        <span className="top-link-original" title={url.originalUrl}>
                          {url.originalUrl}
                        </span>
                      </div>
                      <div className="top-link-clicks">{url.clickCount || 0} clicks</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
