import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  
  // Tab control state
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'preferences'

  // Profile Details Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMsgType, setProfileMsgType] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityMsgType, setSecurityMsgType] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);

  // Preferences State (Mock setting variables)
  const [defaultTtl, setDefaultTtl] = useState("none");
  const [enableNotifs, setEnableNotifs] = useState(true);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    if (!name || !email) {
      setProfileMessage("Name and email are required.");
      setProfileMsgType("error");
      return;
    }

    try {
      setProfileLoading(true);
      const result = await updateProfile(name, email);
      setProfileLoading(false);

      if (result.success) {
        setProfileMessage("Profile updated successfully!");
        setProfileMsgType("success");
      } else {
        setProfileMessage(result.message);
        setProfileMsgType("error");
      }
    } catch (err) {
      setProfileLoading(false);
      setProfileMessage("Profile update failed.");
      setProfileMsgType("error");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecurityMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setSecurityMessage("Please fill in all password fields.");
      setSecurityMsgType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage("New passwords do not match.");
      setSecurityMsgType("error");
      return;
    }

    if (newPassword.length < 8) {
      setSecurityMessage("New password must be at least 8 characters long.");
      setSecurityMsgType("error");
      return;
    }

    try {
      setSecurityLoading(true);
      const result = await updatePassword(oldPassword, newPassword);
      setSecurityLoading(false);

      if (result.success) {
        setSecurityMessage("Password updated successfully!");
        setSecurityMsgType("success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setSecurityMessage(result.message);
        setSecurityMsgType("error");
      }
    } catch (err) {
      setSecurityLoading(false);
      setSecurityMessage("Password update failed.");
      setSecurityMsgType("error");
    }
  };

  return (
    <div className="app-container fade-in">
      <Sidebar />

      <main className="app-main">
        <Navbar />

        <div className="app-content" style={{ display: "flex", justifyContent: "center" }}>
          <div className="settings-panel card" style={{ width: "100%", maxWidth: "680px" }}>
            <div className="settings-tabs-nav">
              <button
                onClick={() => setActiveTab("profile")}
                className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
              >
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
              >
                Security Settings
              </button>
            </div>

            <div className="settings-tab-body">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <form onSubmit={handleUpdateProfile} className="settings-form fade-in">
                  <h4 className="settings-section-title">Update Profile Info</h4>
                  <p className="settings-section-subtitle">Manage your account details and email coordinates.</p>
                  
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ marginTop: "8px" }}>
                    {profileLoading ? "Saving Changes..." : "Save Profile Details"}
                  </button>

                  {profileMessage && (
                    <p className={`message ${profileMsgType === "success" ? "success" : "error"}`} style={{ marginTop: "16px", textAlign: "left" }}>
                      {profileMessage}
                    </p>
                  )}
                </form>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <form onSubmit={handleUpdatePassword} className="settings-form fade-in">
                  <h4 className="settings-section-title">Change Password</h4>
                  <p className="settings-section-subtitle">Keep your SnapLink developer account secure.</p>

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={securityLoading} style={{ marginTop: "8px" }}>
                    {securityLoading ? "Updating Password..." : "Update Password"}
                  </button>

                  {securityMessage && (
                    <p className={`message ${securityMsgType === "success" ? "success" : "error"}`} style={{ marginTop: "16px", textAlign: "left" }}>
                      {securityMessage}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
