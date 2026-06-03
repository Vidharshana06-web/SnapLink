import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./Analytics.css";
import {
  AreaChart,
  Area,
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

      const [urlsRes, summaryRes] = await Promise.all([
        API.get("/url"),
        API.get("/analytics/summary", { params }),
      ]);
      setUrls(urlsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getLineChartData = () => {
    const countsMap = summary.dailyCounts.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    if (selectedDays === 99) {
      return summary.dailyCounts.map((item) => ({
        label: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: item.count,
      }));
    }

    const now = new Date();
    const dateKeys = [];

    for (let i = Number(selectedDays) - 1; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dateKeys.push(date.toISOString().split("T")[0]);
    }

    return dateKeys.map((date) => ({
      label: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: countsMap[date] || 0,
    }));
  };

  const lineChartData = getLineChartData();

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

  // Render Line/Area Chart using Recharts
  const renderLineChart = () => {
    return (
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#6b7280" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: "#0a0b10", 
                border: "1px solid var(--border-glow)", 
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "0.85rem"
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="url(#lineGrad)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#areaGrad)" 
            />
          </AreaChart>
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
              <div className="analytics-card card chart-trend-card">
                <div className="chart-header">
                  <h3 className="chart-title">Link Click Traffic</h3>
                  <span className="chart-subtitle">Unique click logs count over time</span>
                </div>
                <div className="chart-body">{renderLineChart()}</div>
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
