import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

export type PermissionsContextType = {
  permissions: Record<string, string[]> | "all";
  role: string;
  email: string;
  loading: boolean;
  error: string | null;
  resetPermissions: () => void;
  fetchPermissions: () => void;
};

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: {},
  role: "",
  email:"",
  loading: true,
  error: null,
  resetPermissions: () => {},
  fetchPermissions: () => {},
});

export const PermissionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [permissions, setPermissions] = useState<PermissionsContextType["permissions"]>({});
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Fetch permissions logic
  const fetchPermissions = async () => {
    setLoading(true);
    console.log("Fetching permissions...");
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      const email = localStorage.getItem("email");

      if (!token || !userRole || !email) {
        throw new Error("Invalid session. Please log in again.");
      }

      let fetchedPermissions = {};
      if (userRole === "EMPLOYEE") {
        const response = await apiClient.get(`/api/employees?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchedPermissions = response.data.permissions || {};
      } else if (userRole === "ADMIN") {
        const response = await apiClient.get(`/api/auth/admin/login?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchedPermissions = response.data.admin.permissions || "all";
      }

      setPermissions(fetchedPermissions);
      setRole(userRole);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError("Failed to fetch permissions. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions only on first load or when the user logs in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      const email = localStorage.getItem("email");
      
      console.log("Token:", token, "Role:", userRole, "Email:", email); // Add log statements
      //@ts-ignore
      setEmail(email)
      if (token && userRole && email) {
        fetchPermissions();
      } else {
        setLoading(false); // If missing, stop loading
      }
    }
  }, []);

  // Reset state when logging out
  const resetPermissions = () => {
    setPermissions({});
    setRole("");
    setLoading(true);
    setError(null);
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        role,
        loading,
        error,
        resetPermissions,
        email,
        fetchPermissions, // Expose the function to fetch permissions manually
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
