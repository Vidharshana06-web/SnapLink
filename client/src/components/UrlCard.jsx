import { useState } from "react";
import "./UrlCard.css";

const UrlCard = ({ url, onDelete, onDetails, onShare, onEdit }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullUrl = `https://snaplink-backend-7s7p.onrender.com/${url.shortCode}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  return (
    <div className="url-card card fade-in">
      <div className="url-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="url-card-date">Created: {formatDate(url.createdAt)}</span>
          <span className="url-card-date" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            Expires: {formatDate(new Date(new Date(url.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000))}
          </span>
        </div>
        <span className="url-card-clicks">{url.clickCount || 0} clicks</span>
      </div>

      <div className="url-card-body">
        <a
          href={`https://snaplink-backend-7s7p.onrender.com/${url.shortCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="url-card-short"
        >
          snap.lk/{url.shortCode}
        </a>
        <div className="url-card-original" title={url.originalUrl}>
          {url.originalUrl}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "6px" }}>
          Last Activity: {timeAgo(url.lastActivityAt)}
        </div>
      </div>

      <div className="url-card-footer">
        <button onClick={handleCopy} className="url-card-btn btn-copy">
          {copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={() => onEdit(url)} className="url-card-btn" style={{ color: "var(--info)" }}>
          Edit
        </button>
        <button onClick={() => onDetails(url)} className="url-card-btn">
          Analytics
        </button>
        <button onClick={() => onShare(url)} className="url-card-btn">
          Share
        </button>
        <button onClick={() => onDelete(url._id)} className="url-card-btn btn-del">
          Delete
        </button>
      </div>
    </div>
  );
};

export default UrlCard;
