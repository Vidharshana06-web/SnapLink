import { useNavigate } from "react-router-dom";
import "./Expired.css";

const Expired = () => {
  const navigate = useNavigate();

  return (
    <div className="expired-page-container fade-in">
      <div className="expired-card card">
        <div className="expired-icon-wrapper">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            className="expired-svg-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="expired-title">Link Expired</h1>
        <p className="expired-text">
          The link you are trying to access has expired or was deactivated by the workspace owner.
        </p>

        <div className="expired-divider"></div>

        <div className="expired-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
            Go to Dashboard
          </button>
          <button onClick={() => navigate("/login")} className="btn btn-secondary">
            Sign In
          </button>
        </div>

        <div className="expired-tagline">
          ⚡ Powered by <strong>SnapLink</strong>
        </div>
      </div>
    </div>
  );
};

export default Expired;
