import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import UrlTable from "../components/UrlTable";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import QRCode from "qrcode";
import "../App.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const urlInputRef = useRef(null);

  const [urls, setUrls] = useState([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("single"); // 'single' | 'bulk'

  // Bulk Shortener State
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  // Editing State
  const [editingUrl, setEditingUrl] = useState(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'details' | 'share' | 'delete' | 'edit' | null
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [copiedModalLink, setCopiedModalLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Bulk Results Copy Tracker
  const [copiedBulkId, setCopiedBulkId] = useState(null);

  useEffect(() => {
    fetchUrls(false, searchQuery);
    const interval = setInterval(() => {
      fetchUrls(true, searchQuery);
    }, 8000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedUrl) {
      const fullLink = `https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`;
      QRCode.toDataURL(fullLink, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0a0b10",
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("Error generating QR Code:", err);
        });
    } else {
      setQrCodeUrl("");
    }
  }, [selectedUrl]);

  const shareQrCode = async () => {
    if (!qrCodeUrl || !selectedUrl) return;
    try {
      const res = await fetch(qrCodeUrl);
      const blob = await res.blob();
      const file = new File([blob], `qr-${selectedUrl.shortCode}.png`, { type: "image/png" });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SnapLink QR Code",
          text: `Check out this link: https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`,
        });
      } else {
        navigator.clipboard.writeText(`https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`);
        alert("Link copied to clipboard! Share it with your friends.");
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
    }
  };

  const fetchUrls = async (silent = false, query = "") => {
    try {
      if (!silent) setLoading(true);
      const response = await API.get("/url", {
        params: query ? { q: query } : {},
      });
      setUrls(response.data);
    } catch (error) {
      console.error("Error fetching URLs:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!originalUrl) {
      setErrorMessage("Please enter a URL to shorten.");
      return;
    }

    // Basic URL validation
    try {
      new URL(originalUrl);
    } catch (_) {
      setErrorMessage("Please enter a valid absolute URL (e.g. https://google.com).");
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await API.post("/url/create", { 
        originalUrl, 
        customShortCode: customShortCode ? customShortCode.trim() : undefined,
        title: title ? title.trim() : undefined,
        expiresAt: expiresAt || undefined,
      });
      const newUrlObj = response.data.data;
      
      setUrls([newUrlObj, ...urls]);
      setOriginalUrl("");
      setTitle("");
      setExpiresAt("");
      setCustomShortCode("");
      setSuccessMessage("Short URL generated successfully!");
      
      // Auto-trigger share modal for the newly created URL
      setSelectedUrl(newUrlObj);
      setActiveModal("share");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to create short URL."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Bulk Upload File Handler
  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    readAndParseFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    readAndParseFile(file);
  };

  const readAndParseFile = (file) => {
    setBulkError("");
    setBulkSuccess("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      // Parse URLs by newlines or commas
      const parsedUrls = text
        .split(/[\n,]/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0 && (u.startsWith("http://") || u.startsWith("https://")));
      
      if (parsedUrls.length === 0) {
        setBulkError("No valid absolute URLs (starting with http:// or https://) found in the file.");
      } else {
        setBulkText(parsedUrls.join("\n"));
        setBulkSuccess(`Successfully loaded ${parsedUrls.length} URLs from ${file.name}!`);
        setTimeout(() => setBulkSuccess(""), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkShorten = async () => {
    setBulkError("");
    setBulkSuccess("");
    const urlsToShorten = bulkText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlsToShorten.length === 0) {
      setBulkError("Please enter or upload at least one valid URL.");
      return;
    }

    // Validate all URLs
    for (const u of urlsToShorten) {
      try {
        new URL(u);
      } catch (_) {
        setBulkError(`Invalid absolute URL found: "${u}". Make sure it starts with http:// or https://`);
        return;
      }
    }

    try {
      setBulkLoading(true);
      const response = await API.post("/url/bulk", { urls: urlsToShorten });
      const created = response.data.data;
      setBulkResults(created);
      setUrls([...created, ...urls]);
      setBulkText("");
      setBulkSuccess(`Successfully shortened ${created.length} URLs!`);
    } catch (error) {
      setBulkError(error.response?.data?.message || "Failed to shorten URLs in batch.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleEditClick = (urlObj) => {
    setEditingUrl(urlObj);
    setEditOriginalUrl(urlObj.originalUrl);
    setEditTitle(urlObj.title || "");
    setEditExpiresAt(urlObj.expiresAt ? new Date(urlObj.expiresAt).toISOString().slice(0, 10) : "");
    setEditError("");
    setActiveModal("edit");
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!editOriginalUrl) {
      setEditError("Destination URL cannot be empty.");
      return;
    }

    try {
      new URL(editOriginalUrl);
    } catch (_) {
      setEditError("Please enter a valid absolute URL (e.g. https://google.com).");
      return;
    }

    if (editExpiresAt) {
      const expiry = new Date(editExpiresAt);
      if (Number.isNaN(expiry.getTime())) {
        setEditError("Please enter a valid expiration date.");
        return;
      }
      if (expiry <= new Date()) {
        setEditError("Expiration date must be in the future.");
        return;
      }
    }

    try {
      setEditLoading(true);
      const response = await API.put(`/url/${editingUrl._id}`, {
        originalUrl: editOriginalUrl,
        title: editTitle,
        expiresAt: editExpiresAt,
      });
      const updatedUrl = response.data.data;

      setUrls(urls.map((u) => (u._id === updatedUrl._id ? updatedUrl : u)));
      setActiveModal(null);
      setEditingUrl(null);
    } catch (error) {
      setEditError(error.response?.data?.message || "Failed to update destination URL.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    const urlObj = urls.find((u) => u._id === id);
    setSelectedUrl(urlObj);
    setActiveModal("delete");
  };

  const confirmDelete = async () => {
    if (!selectedUrl) return;
    try {
      await API.delete(`/url/${selectedUrl._id}`);
      setUrls(urls.filter((u) => u._id !== selectedUrl._id));
      setActiveModal(null);
      setSelectedUrl(null);
    } catch (error) {
      alert("Error deleting URL: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDetailsClick = (urlObj) => {
    setSelectedUrl(urlObj);
    setActiveModal("details");
  };

  const handleShareClick = (urlObj) => {
    setSelectedUrl(urlObj);
    setActiveModal("share");
  };

  const copyModalLink = () => {
    if (!selectedUrl) return;
    const fullLink = `https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopiedModalLink(true);
      setTimeout(() => setCopiedModalLink(false), 1200);
    });
  };

  const copyBulkLink = (shortCode, id) => {
    const fullLink = `https://snaplink-backend-7s7p.onrender.com/${shortCode}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopiedBulkId(id);
      setTimeout(() => setCopiedBulkId(null), 1200);
    });
  };

  // Compute stats (100% backend driven, no fake percentages)
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, item) => sum + (item.clickCount || 0), 0);
  const activeUrls = urls.filter((item) => item.clickCount > 0).length;
  const avgClicks = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : "0.0";

  return (
    <div className="app-container fade-in">
      <Sidebar />
      
      <main className="app-main">
        <Navbar />
        
        <div className="app-content">
          {/* Welcome header section */}
          <div className="dashboard-header">
            <div className="dashboard-welcome">
              <h1>Workspace</h1>
              <p>Welcome back, {user?.name}! Dynamic link workspace.</p>
            </div>
            <button
              onClick={() => {
                if (urlInputRef.current) {
                  urlInputRef.current.focus();
                  urlInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="btn btn-primary"
            >
              Shorten URL ⚡
            </button>
          </div>

          {/* Stats Cards Dashboard Grid */}
          <div className="stats-grid">
            <StatsCard
              title="Total URLs"
              value={loading ? "..." : totalUrls}
              trend="All workspace links"
              trendType="neutral"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            />
            <StatsCard
              title="Total Clicks"
              value={loading ? "..." : totalClicks}
              trend="Dynamic redirection hits"
              trendType="neutral"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
            />
            <StatsCard
              title="Active Links"
              value={loading ? "..." : activeUrls}
              trend="Links with active clicks"
              trendType="neutral"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Avg. Clicks / Link"
              value={loading ? "..." : avgClicks}
              trend="Clicks performance metric"
              trendType="neutral"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Interactive Workspace Tab Selector */}
          <div className="tab-control-card card" style={{ padding: "8px", display: "inline-flex", gap: "6px", marginBottom: "20px", borderRadius: "10px" }}>
            <button 
              onClick={() => setActiveTab("single")} 
              className={`btn ${activeTab === "single" ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}
            >
              Single Link Shortener
            </button>
            <button 
              onClick={() => setActiveTab("bulk")} 
              className={`btn ${activeTab === "bulk" ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}
            >
              Bulk URL Shortener 📦
            </button>
          </div>

          {activeTab === "single" ? (
            /* URL Shortening Input Panel */
            <div className="url-shorten-container card" style={{ padding: "24px", background: "var(--bg-card)", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
              <form onSubmit={handleShorten} className="url-shorten-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <div className="input-wrapper" style={{ flexGrow: 3 }}>
                    <input
                      ref={urlInputRef}
                      type="text"
                      className="form-input"
                      placeholder="Paste your long link here (e.g. https://github.com/google/gemini)..."
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper" style={{ flexGrow: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Custom Alias (optional)..."
                      value={customShortCode}
                      onChange={(e) => setCustomShortCode(e.target.value)}
                      style={{ borderStyle: "dashed" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <div className="input-wrapper" style={{ flexGrow: 2 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Label / Title (optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper" style={{ flexGrow: 1 }}>
                    <input
                      type="date"
                      className="form-input"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitLoading} style={{ alignSelf: "flex-end" }}>
                  {submitLoading ? "Shortening..." : "Shorten Link ⚡"}
                </button>
              </form>
              {errorMessage && <p className="field-error" style={{ marginTop: "12px" }}>{errorMessage}</p>}
              {successMessage && <p className="message success" style={{ marginTop: "12px", textAlign: "left" }}>{successMessage}</p>}
            </div>
          ) : (
            /* Bulk URL Shortener System */
            <div className="bulk-shorten-container card" style={{ padding: "24px", background: "var(--bg-card)", border: "1px solid var(--border-color)", marginBottom: "30px", animation: "modal-fade-in 0.2s ease" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Bulk URL shortener</span>
                <span className="badge badge-pro" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>Enterprise</span>
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                Paste multiple links (one per line) or drag & drop a `.csv` / `.txt` file containing absolute URLs.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Drag and Drop Zone + Textarea */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <textarea
                    className="form-input"
                    placeholder="https://example.com/page1&#10;https://google.com&#10;https://github.com"
                    rows="6"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
                  ></textarea>

                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                      border: "2px dashed rgba(99, 102, 241, 0.25)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      textAlign: "center",
                      background: "rgba(255, 255, 255, 0.01)",
                      cursor: "pointer",
                      transition: "border-color var(--transition-fast)"
                    }}
                    onClick={() => document.getElementById("bulk-file-input").click()}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-glow)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.25)"}
                  >
                    <input 
                      type="file" 
                      id="bulk-file-input" 
                      accept=".csv,.txt" 
                      onChange={handleBulkFileChange}
                      style={{ display: "none" }} 
                    />
                    <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>📂</div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Drag & Drop CSV / TXT or click to browse
                    </span>
                  </div>

                  <button 
                    onClick={handleBulkShorten} 
                    className="btn btn-primary" 
                    disabled={bulkLoading || !bulkText.trim()}
                    style={{ width: "100%", padding: "12px" }}
                  >
                    {bulkLoading ? "Processing Batch..." : "Bulk Shorten URLs 📦"}
                  </button>

                  {bulkError && <p className="field-error">{bulkError}</p>}
                  {bulkSuccess && <p className="message success" style={{ textAlign: "left" }}>{bulkSuccess}</p>}
                </div>

                {/* Bulk Results Table Container */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span className="form-label" style={{ fontSize: "0.75rem" }}>Batch Results List</span>
                  {bulkResults.length === 0 ? (
                    <div style={{ border: "1px dashed var(--border-color)", borderRadius: "var(--radius-sm)", flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px" }}>
                      Shortened links will generate dynamically here.
                    </div>
                  ) : (
                    <div className="table-container" style={{ maxHeight: "310px", overflowY: "auto" }}>
                      <table className="saas-table" style={{ fontSize: "0.8rem" }}>
                        <thead>
                          <tr>
                            <th>Original</th>
                            <th>Short Code</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResults.map((b) => (
                            <tr key={b._id}>
                              <td style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {b.originalUrl}
                              </td>
                              <td style={{ fontWeight: "600", color: "#818cf8" }}>
                                snap.lk/{b.shortCode}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button 
                                    onClick={() => copyBulkLink(b.shortCode, b._id)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                  >
                                    {copiedBulkId === b._id ? "Copied" : "Copy"}
                                  </button>
                                  <button 
                                    onClick={() => handleShareClick(b)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: "4px 6px", fontSize: "0.75rem" }}
                                    title="View QR Code"
                                  >
                                    QR
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URLs list table or empty state */}
          <div style={{ marginTop: "40px" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--text-light)" }}>Recent Shortened Links</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, URL, or alias"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "240px", flex: 1 }}
            />
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {urls.length} link{urls.length === 1 ? "" : "s"}
            </span>
          </div>
            
            {loading ? (
              // Loading skeletons
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-card" style={{ height: "60px" }}></div>
                <div className="skeleton skeleton-card" style={{ height: "60px" }}></div>
                <div className="skeleton skeleton-card" style={{ height: "60px" }}></div>
              </div>
            ) : urls.length === 0 ? (
              // Empty State
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <div className="empty-state-title">No URLs shortened yet</div>
                <div className="empty-state-text">
                  Shorten your first URL to view analytics stats, track click-through records, and share links with developers.
                </div>
                <button
                  onClick={() => {
                    if (urlInputRef.current) urlInputRef.current.focus();
                  }}
                  className="btn btn-primary"
                >
                  Create your first link
                </button>
              </div>
            ) : (
              // URL display table
              <UrlTable
                urls={urls}
                onDelete={handleDeleteClick}
                onDetails={handleDetailsClick}
                onShare={handleShareClick}
                onEdit={handleEditClick}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button (FAB) for Mobile Quick focus */}
      <button
        onClick={() => {
          if (urlInputRef.current) {
            urlInputRef.current.focus();
            urlInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
        className="fab-btn"
        title="Shorten new link"
      >
        +
      </button>

      {/* DETAILS MODAL */}
      {activeModal === "details" && selectedUrl && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Link details</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                <div>
                  <span className="form-label" style={{ fontSize: "0.75rem" }}>Original link</span>
                  <a
                    href={selectedUrl.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ wordBreak: "break-all", fontSize: "0.95rem" }}
                  >
                    {selectedUrl.originalUrl}
                  </a>
                </div>
                <div>
                  <span className="form-label" style={{ fontSize: "0.75rem" }}>Title</span>
                  <div style={{ fontSize: "1rem", color: "var(--text-secondary)", minHeight: "24px" }}>
                    {selectedUrl.title || "No title set"}
                  </div>
                </div>
                <div>
                  <span className="form-label" style={{ fontSize: "0.75rem" }}>Short Link</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <a
                      href={`https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#818cf8", fontWeight: "600", fontSize: "1.1rem" }}
                    >
                      snap.lk/{selectedUrl.shortCode}
                    </a>
                    <button
                      onClick={copyModalLink}
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    >
                      {copiedModalLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "8px" }}>
                  <div>
                    <span className="form-label" style={{ fontSize: "0.75rem" }}>Total traffic</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#06b6d4" }}>
                      {selectedUrl.clickCount || 0} Clicks
                    </span>
                  </div>
                  <div>
                    <span className="form-label" style={{ fontSize: "0.75rem" }}>Created Date</span>
                    <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>
                      {new Date(selectedUrl.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="form-label" style={{ fontSize: "0.75rem" }}>Expiration Date</span>
                    <span style={{ fontSize: "1rem", color: selectedUrl.expiresAt ? "var(--warning)" : "var(--text-secondary)" }}>
                      {selectedUrl.expiresAt ? new Date(selectedUrl.expiresAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate(`/analytics?id=${selectedUrl._id}`);
                }}
                className="btn btn-primary"
              >
                Open Analytics Engine
              </button>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {activeModal === "share" && selectedUrl && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Share shortened URL</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: "left" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "16px", fontSize: "0.9rem" }}>
                Your short URL is ready. Copy it to your clipboard, download/share the QR Code, or share directly on channels:
              </p>

              {/* Dynamic QR Code Display */}
              {qrCodeUrl && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "20px" }}>
                  <img src={qrCodeUrl} alt="Short URL QR Code" style={{ width: "160px", height: "160px", borderRadius: "var(--radius-sm)", display: "block" }} />
                  <div style={{ display: "flex", width: "100%", gap: "8px", marginTop: "14px" }}>
                    <a href={qrCodeUrl} download={`qr-${selectedUrl.shortCode}.png`} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.8rem", padding: "8px", textAlign: "center" }}>
                      ⬇️ Download QR
                    </a>
                    <button onClick={shareQrCode} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.8rem", padding: "8px" }}>
                      🔗 Share QR
                    </button>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={`https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`}
                  style={{ background: "rgba(0,0,0,0.3)" }}
                />
                <button onClick={copyModalLink} className="btn btn-primary">
                  {copiedModalLink ? "Copied!" : "Copy"}
                </button>
              </div>

              <span className="form-label" style={{ fontSize: "0.75rem", marginBottom: "10px" }}>Share channels</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <a
                  href={`https://twitter.com/intent/tweet?url=https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}&text=Check out this shortened link!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "8px" }}
                >
                  🐦 Twitter
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "8px" }}
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`mailto:?subject=SnapLink Shared Link&body=Check out this link: https://snaplink-backend-7s7p.onrender.com/${selectedUrl.shortCode}`}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "8px" }}
                >
                  ✉️ Email
                </a>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {activeModal === "edit" && editingUrl && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleEditSave}>
              <div className="modal-header">
                <h3 className="modal-title">Edit destination URL</h3>
                <button type="button" className="modal-close" onClick={() => setActiveModal(null)}>×</button>
              </div>
              <div className="modal-body" style={{ textAlign: "left" }}>
                <div className="form-group">
                  <span className="form-label">Short link path</span>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={`snap.lk/${editingUrl.shortCode}`}
                    style={{ background: "rgba(0,0,0,0.25)", color: "var(--text-secondary)" }}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">New original / destination URL</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://new-destination-url.com"
                    value={editOriginalUrl}
                    onChange={(e) => setEditOriginalUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Link title / label</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Optional link label"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <span className="form-label">Expiration date</span>
                  <input
                    type="date"
                    className="form-input"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                  />
                </div>
                {editError && <p className="field-error">{editError}</p>}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activeModal === "delete" && selectedUrl && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--error)" }}>Delete confirmation</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: "left" }}>
              <p style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
                Are you sure you want to delete this shortened link?
              </p>
              <code style={{ wordBreak: "break-all", background: "rgba(0,0,0,0.35)", padding: "8px", display: "block" }}>
                snap.lk/{selectedUrl.shortCode}
              </code>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "12px" }}>
                Warning: This action is permanent. All traffic hitting this link will encounter a redirection error page.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={confirmDelete} className="btn btn-danger">
                Delete link permanently
              </button>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
