import { createContext, useState, useEffect, useContext } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const storedToken = localStorage.getItem("snaplink_token");
    const storedUser = localStorage.getItem("snaplink_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem("snaplink_token", receivedToken);
      localStorage.setItem("snaplink_user", JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid credentials",
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await API.post("/auth/register", { name, email, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("snaplink_token");
    localStorage.removeItem("snaplink_user");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name, email) => {
    try {
      const response = await API.put("/auth/profile", { name, email });
      const { user: updatedUser } = response.data;

      localStorage.setItem("snaplink_user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      const response = await API.put("/auth/password", { oldPassword, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update password",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
