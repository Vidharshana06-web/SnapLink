import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InteractiveAuthBg from "../components/InteractiveAuthBg";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Evaluate password strength dynamically
  const evaluatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "", className: "" };
    let score = 0;
    
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, text: "Weak", className: "strength-weak" };
      case 2:
        return { score: 2, text: "Medium", className: "strength-medium" };
      case 3:
        return { score: 3, text: "Strong", className: "strength-strong" };
      case 4:
        return { score: 4, text: "Excellent", className: "strength-excellent" };
      default:
        return { score: 0, text: "Too Short", className: "strength-weak" };
    }
  };

  const strength = evaluatePasswordStrength(password);

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmPasswordError("");
    setMessage("");

    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill in all required fields.");
      setMessageType("error");
      return;
    }

    if (!agreeTerms) {
      setMessage("You must agree to the Terms of Service.");
      setMessageType("error");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must contain 8+ characters, uppercase, lowercase, a number and a special symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      setMessage("Account created successfully! Redirecting...");
      setMessageType("success");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
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
          <h2 className="auth-card-title">Create your account</h2>
          <p className="auth-card-subtitle">Get started with a free trial today.</p>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Developer John"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${passwordError ? "error" : ""}`}
                  placeholder="Create a strong password"
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
              
              {/* Password Strength display */}
              {password && (
                <div className={`password-strength-container ${strength.className}`}>
                  <div className="password-strength-bars">
                    <div className="password-strength-bar"></div>
                    <div className="password-strength-bar"></div>
                    <div className="password-strength-bar"></div>
                    <div className="password-strength-bar"></div>
                  </div>
                  <div className="password-strength-text">
                    Password Strength: {strength.text}
                  </div>
                </div>
              )}

              {passwordError && <span className="field-error">{passwordError}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input ${confirmPasswordError ? "error" : ""}`}
                  placeholder="Verify your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
              {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
            </div>

            <div className="auth-checkbox-group">
              <input
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="agree" className="auth-checkbox-label">
                I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {message && (
              <p className={`message ${messageType === "success" ? "success" : "error"}`}>
                {message}
              </p>
            )}

            <div className="auth-redirect" style={{ marginTop: "24px" }}>
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;