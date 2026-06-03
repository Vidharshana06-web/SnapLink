import { useState } from "react";
import "./UrlTable.css";

const UrlTable = ({ urls, onDelete, onDetails, onShare, onEdit }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, shortCode) => {
    const fullShortUrl = `http://localhost:5000/${shortCode}`;
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 1200);
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!urls || urls.length === 0) {
    return null; /* Parent will display empty state */
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return "Never";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getStatus = (expiresAt) => {
    const expiration = parseDate(expiresAt);
    if (!expiration) {
      return { label: "Active", variant: "active" };
    }

    const now = new Date();
    const diffDays = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));
    if (now > expiration) {
      return { label: "Expired", variant: "expired" };
    }
    if (diffDays <= 7) {
      return { label: `Expires in ${diffDays}d`, variant: "warning" };
    }
    return { label: "Active", variant: "active" };
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-container fade-in">
        <table className="saas-table">
          <thead>
            <tr>
              <th>Original Link</th>
              <th>Short Link</th>
              <th>Clicks</th>
              <th>Last Activity</th>
              <th>Created</th>
              <th>Expires</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((url) => {
              const status = getStatus(url.expiresAt);
              return (
                <tr key={url._id}>
                  <td className="original-url-cell">
                    {url.title ? (
                      <div className="url-title-tag">{url.title}</div>
                    ) : null}
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={url.originalUrl}
                    >
                      {url.originalUrl}
                    </a>
                  </td>
                  <td className="short-url-cell">
                    <div className="short-url-wrapper">
                      <a
                        href={`http://localhost:5000/${url.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="short-link-href"
                      >
                        snap.lk/{url.shortCode}
                      </a>
                      <a
                        href={`http://localhost:5000/${url.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="redirect-link-icon-btn"
                        title="Open short URL in new tab"
                        style={{ display: "inline-flex", alignItems: "center", color: "var(--text-secondary)", marginLeft: "4px" }}
                      >
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ width: "14px", height: "14px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleCopy(url._id, url.shortCode)}
                        className="copy-btn"
                        title="Copy Short URL"
                      >
                        {copiedId === url._id ? (
                          <span className="copy-tooltip">Copied!</span>
                        ) : null}
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="clicks-badge">
                      {url.clickCount || 0} clicks
                    </span>
                  </td>
                  <td>
                    <span className="last-activity-span" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {timeAgo(url.lastActivityAt)}
                    </span>
                  </td>
                  <td>
                    <span className="date-span">{formatDate(url.createdAt)}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="date-span" style={{ color: url.expiresAt ? "var(--warning)" : "var(--text-secondary)" }}>
                        {url.expiresAt ? formatDate(url.expiresAt) : "Never"}
                      </span>
                      <span className={`status-badge ${status.variant}`}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                      <button
                        onClick={() => onDetails(url)}
                        className="action-icon-btn btn-view"
                        title="View Analytics Details"
                      >
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => onEdit(url)}
                        className="action-icon-btn btn-edit"
                        title="Edit Destination URL"
                        style={{ color: "var(--info)" }}
                      >
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => onShare(url)}
                        className="action-icon-btn btn-share"
                        title="Share & QR Code"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="3" height="3" rx="0.5" />
                          <rect x="18" y="18" width="3" height="3" rx="0.5" />
                          <rect x="14" y="18" width="2" height="2" />
                          <rect x="18" y="14" width="2" height="2" />
                        </svg>
                      </button>

                      <button
                        onClick={() => onDelete(url._id)}
                        className="action-icon-btn btn-delete"
                        title="Delete Link"
                      >
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View (reflows automatically based on media query in App.css) */}
      <div className="mobile-url-cards fade-in">
        {urls.map((url) => {
          const status = getStatus(url.expiresAt);
          return (
            <div key={url._id} className="mobile-url-card">
              <div className="mobile-url-card-header">
                <span className="clicks-badge">{url.clickCount || 0} clicks</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                  <span className="mobile-date" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Active: {timeAgo(url.lastActivityAt)}
                  </span>
                  <span className="mobile-date" style={{ fontSize: "0.72rem", color: "rgba(245, 158, 11, 0.75)" }}>
                    Expires: {url.expiresAt ? formatDate(url.expiresAt) : "Never"}
                  </span>
                  <span className={`status-badge ${status.variant}`} style={{ marginTop: "4px", alignSelf: "flex-end" }}>
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="mobile-url-card-links">
                <div className="mobile-url-card-short-row">
                  <a
                    href={`http://localhost:5000/${url.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-short-link"
                  >
                    snap.lk/{url.shortCode}
                  </a>
                  <a
                    href={`http://localhost:5000/${url.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="redirect-link-icon-btn"
                    title="Open short URL in new tab"
                    style={{ display: "inline-flex", alignItems: "center", color: "var(--text-secondary)", marginLeft: "4px" }}
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      style={{ width: "14px", height: "14px" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleCopy(url._id, url.shortCode)}
                    className="mobile-copy-btn"
                  >
                    {copiedId === url._id ? "Copied" : "Copy"}
                  </button>
                </div>
                <div>
                  {url.title && <div className="mobile-url-card-title">{url.title}</div>}
                  <div className="mobile-url-card-original">{url.originalUrl}</div>
                </div>
              </div>

              <div className="mobile-url-card-footer">
                <button onClick={() => onDetails(url)} className="mobile-action-text-btn">
                  Analytics
                </button>
                <button onClick={() => onEdit(url)} className="mobile-action-text-btn" style={{ color: "var(--info)" }}>
                  Edit
                </button>
                <button onClick={() => onShare(url)} className="mobile-action-text-btn">
                  QR & Share
                </button>
                <button onClick={() => onDelete(url._id)} className="mobile-action-text-btn btn-danger-text">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default UrlTable;
