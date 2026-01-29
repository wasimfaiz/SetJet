"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

// Define the shape of the context
interface EmployeeContextType {
  employeeId: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
  role: string | null; // Add role to context
  loading: boolean;
  error: string | null;
  refetchEmployeeDetails: () => void;
  logout: () => void;
}

const EmployeeContext = createContext<EmployeeContextType>({
  employeeId: null,
  employeeName: null,
  employeeEmail: null,
  role: null,
  loading: true,
  error: null,
  refetchEmployeeDetails: () => {},
  logout: () => {},
});

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [employeeEmail, setEmployeeEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // Track role
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeDetails = async () => {
    const email = localStorage.getItem("email");
    const userRole = localStorage.getItem("role"); // Assuming role is saved in localStorage
    if (!email || !userRole) {
      setError("Email or role not found in local storage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let response;

      if (userRole === "ADMIN") {
        // Call API to get admin details
        response = await apiClient.get(`/api/auth/admin/login?email=${email}`);
        setEmployeeName(response?.data?.admin?.name || null);
        setEmployeeEmail(response?.data?.admin?.email || null);
        setEmployeeId(response?.data?.admin?._id);
      } else if (userRole === "EMPLOYEE") {
        // Call API to get employee details
        response = await apiClient.get(`/api/employees?email=${email}`);
        setEmployeeName(response?.data?.basicField?.name || null);
        setEmployeeEmail(response?.data?.basicField?.email || null);
        setEmployeeId(response?.data?._id);
      } else {
        throw new Error("Invalid role.");
      }

      const data = response.data;
      setRole(userRole);
      setError(null);
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setError("Failed to fetch employee details.");
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage and reset context state
    localStorage.clear();
    setEmployeeId(null);
    setEmployeeName(null);
    setEmployeeEmail(null);
    setRole(null);
    setError(null);
    // Optionally redirect to the login page
    // router.push("/");
  };

  useEffect(() => {
    if (!employeeId || !employeeName || !employeeEmail || !role) {
      fetchEmployeeDetails();
    }
  }, [employeeId, employeeName, employeeEmail, role]);

  return (
    <EmployeeContext.Provider
      value={{
        employeeId,
        employeeName,
        employeeEmail,
        role,
        loading,
        error,
        refetchEmployeeDetails: fetchEmployeeDetails,
        logout,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// Custom hook to use the context
export const useEmployeeContext = () => {
  return useContext(EmployeeContext);
};
