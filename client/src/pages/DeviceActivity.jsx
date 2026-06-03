import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./DeviceActivity.css";
import {
  FaChrome,
  FaFirefoxBrowser,
  FaSafari,
  FaEdge,
} from "react-icons/fa";

import {
  MdDesktopWindows,
  MdTabletMac,
  MdPhoneIphone,
} from "react-icons/md";

const DeviceActivity = () => {
  const [logs, setLogs] = useState([]);
  const [urls, setUrls] = useState([]);
  const [selectedUrlId, setSelectedUrlId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user URLs to map urlId to originalUrl/shortCode
      const urlsResponse = await API.get("/url");
      setUrls(urlsResponse.data);

      // Fetch all analytics click logs
      const logsResponse = await API.get("/analytics");
      setLogs(logsResponse.data);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to find shortCode/originalUrl by urlId
  const getUrlMeta = (urlId) => {
    const found = urls.find((u) => u._id === urlId);
    return found ? { shortCode: found.shortCode, originalUrl: found.originalUrl } : { shortCode: "unknown", originalUrl: "N/A" };
  };

  // Filter logs by selected URL
  const filteredLogs = selectedUrlId === "all"
    ? logs
    : logs.filter((log) => log.urlId === selectedUrlId);

  // Format Access Time
  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

 



 const getBrowserIcon = (browserName) => {
  switch (browserName) {
    case "Chrome":
      return (
        <>
          <FaChrome /> <span>Chrome</span>
        </>
      );

    case "Firefox":
      return (
        <>
          <FaFirefoxBrowser /> <span>Firefox</span>
        </>
      );

    case "Safari":
      return (
        <>
          <FaSafari /> <span>Safari</span>
        </>
      );

    case "Edge":
      return (
        <>
          <FaEdge /> <span>Edge</span>
        </>
      );

    default:
      return (
        <>
          <FaChrome /> <span>Unknown</span>
        </>
      );
  }
};

const getDeviceIcon = (deviceType) => {
  switch (deviceType) {
    case "Mobile":
      return (
        <>
          <MdPhoneIphone /> <span>Mobile</span>
        </>
      );

    case "Tablet":
      return (
        <>
          <MdTabletMac /> <span>Tablet</span>
        </>
      );

    case "Desktop":
      return (
        <>
          <MdDesktopWindows /> <span>Desktop</span>
        </>
      );

    default:
      return (
        <>
          <MdDesktopWindows /> <span>Unknown</span>
        </>
      );
  }
};

  return (
    <div className="app-container fade-in">
      <Sidebar />

      <main className="app-main">
        <Navbar />

        <div className="app-content">
          <div className="activity-header-panel">
            <h2 className="activity-title" style={{ color: "var(--text-light)" }}>Real-Time Click stream</h2>
            <p className="activity-subtitle" style={{ color: "var(--text-secondary)" }}>
              Inspect and track click access details, device breakdowns, and real visitor geo-locations live.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="activity-filter-card card" style={{ padding: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
              <label className="form-label" style={{ margin: 0, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                Filter By Link:
              </label>
              <select
                className="form-input"
                value={selectedUrlId}
                onChange={(e) => setSelectedUrlId(e.target.value)}
                style={{ maxWidth: "340px", background: "rgba(0,0,0,0.3)" }}
              >
                <option value="all">All Shortened Links ({urls.length})</option>
                {urls.map((u) => (
                  <option key={u._id} value={u._id}>
                    snap.lk/{u.shortCode} → {u.originalUrl.substring(0, 30)}...
                  </option>
                ))}
              </select>
              <button onClick={fetchData} className="btn btn-secondary" style={{ marginLeft: "auto", padding: "8px 14px", fontSize: "0.8rem" }}>
                🔄 Refresh Logs
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="skeleton skeleton-title" style={{ width: "200px" }}></div>
              <div className="skeleton skeleton-card" style={{ height: "55px" }}></div>
              <div className="skeleton skeleton-card" style={{ height: "55px" }}></div>
              <div className="skeleton skeleton-card" style={{ height: "55px" }}></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No click logs recorded yet</div>
              <div className="empty-state-text">
                Your click log stream is empty. Share your shortened links and whenever someone clicks them, access logs will update here in real-time.
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-container activity-table-wrapper fade-in">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Short link</th>
                      <th>Device Type</th>
                      <th>Browser</th>
                      <th>Time of Access</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const meta = getUrlMeta(log.urlId);
                      const displayLoc = log.location && log.location !== "Unknown" ? log.location : "Location not available";
                      return (
                        <tr key={log._id}>
                          <td style={{ fontWeight: "600", color: "#818cf8" }}>
                            <a
                              href={`https://snaplink-backend-7s7p.onrender.com/${meta.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="short-link-href"
                            >
                              snap.lk/{meta.shortCode}
                            </a>
                          </td>
                          <td>
                            <span className="device-tag">{getDeviceIcon(log.device)}</span>
                          </td>
                          <td>
                            <span className="browser-tag">{getBrowserIcon(log.browser)}</span>
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            {formatTime(log.visitedAt || log.createdAt)}
                          </td>
                          <td>
                            <span className="badge badge-new" style={{ textTransform: "none", letterSpacing: "normal", padding: "4px 10px", fontSize: "0.8rem", background: displayLoc === "Location not available" ? "var(--error-bg)" : "var(--success-bg)", color: displayLoc === "Location not available" ? "var(--error)" : "var(--success)" }}>
                              {displayLoc}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Reflow */}
              <div className="mobile-url-cards mobile-activity-cards fade-in" style={{ display: "none" }}>
                {filteredLogs.map((log) => {
                  const meta = getUrlMeta(log.urlId);
                  const displayLoc = log.location && log.location !== "Unknown" ? log.location : "Location not available";
                  return (
                    <div key={log._id} className="mobile-url-card">
                      <div className="mobile-url-card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "10px" }}>
                        <span className="mobile-short-link" style={{ fontWeight: "700", color: "#818cf8" }}>
                          snap.lk/{meta.shortCode}
                        </span>
                        <span className="badge badge-new" style={{ fontSize: "0.75rem", textTransform: "none", background: displayLoc === "Location not available" ? "var(--error-bg)" : "var(--success-bg)", color: displayLoc === "Location not available" ? "var(--error)" : "var(--success)" }}>
                          📍 {displayLoc}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Device Type:</span>
                          <strong style={{ color: "var(--text-primary)" }}>{getDeviceIcon(log.device)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Browser:</span>
                          <strong style={{ color: "var(--text-primary)" }}>{getBrowserIcon(log.browser)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Access Time:</span>
                          <strong>{formatTime(log.visitedAt || log.createdAt)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DeviceActivity;
