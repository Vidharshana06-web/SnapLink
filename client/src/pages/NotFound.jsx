import { useNavigate } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page-container fade-in">
      <div className="notfound-card card">
        <div className="notfound-icon-wrapper">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            className="notfound-svg-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="notfound-title">404 - Not Found</h1>
        <p className="notfound-text">
          The page or link shortcode you are looking for does not exist, has been deleted, or has been moved to another path.
        </p>

        <div className="notfound-divider"></div>

        <button onClick={() => navigate("/dashboard")} className="btn btn-primary" style={{ width: "100%" }}>
          Back to Dashboard
        </button>

        <div className="notfound-logo-footer">
          ⚡ SnapLink
        </div>
      </div>
    </div>
  );
};

export default NotFound;
