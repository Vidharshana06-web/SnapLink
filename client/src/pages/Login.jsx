import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InteractiveAuthBg from "../components/InteractiveAuthBg";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email || !password) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setMessage("Login successful! Redirecting...");
      setMessageType("success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } else {
      setMessage(result.message);
      setMessageType("error");
    }
  };

  return (
    <div className="auth-page fade-in">
      <InteractiveAuthBg />
      {/* Floating Background Blobs */}
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>
      <div className="auth-bg-blob blob-3"></div>

      <div className="auth-card-container">
        <div className="auth-brand">
          <span className="logo-icon" style={{ fontSize: "2rem" }}>⚡</span>
          <span className="auth-brand-name">SnapLink</span>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-subtitle">Sign in to manage your shortened links.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#forgot" className="forgot-password-link" style={{ fontSize: "0.8rem" }}>
                  Forgot Password?
                </a>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {message && (
              <p className={`message ${messageType === "success" ? "success" : "error"}`} style={{ marginTop: "16px" }}>
                {message}
              </p>
            )}

            <div className="auth-redirect" style={{ marginTop: "24px" }}>
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;