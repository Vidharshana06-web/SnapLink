import "./StatsCard.css";

const StatsCard = ({ title, value, icon, trend, trendType = "neutral" }) => {
  return (
    <div className="stats-card card">
      <div className="stats-card-header">
        <span className="stats-card-title">{title}</span>
        {icon && <div className="stats-card-icon">{icon}</div>}
      </div>
      <div className="stats-card-body">
        <h3 className="stats-card-value">{value}</h3>
        {trend && (
          <div className={`stats-card-trend trend-${trendType}`}>
            {trendType === "success" ? (
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ width: "12px", height: "12px" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : trendType === "error" ? (
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ width: "12px", height: "12px" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : null}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
