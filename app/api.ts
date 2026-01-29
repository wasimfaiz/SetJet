"use client";
import axios, { AxiosRequestConfig, AxiosError } from "axios";

// Function to handle API requests
const apiRequest = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any
) => {
  if (typeof window === "undefined") {
    throw new Error(
      "API requests should only be made in a client environment."
    );
  }

  const token = localStorage.getItem("token");

  // Check if token is available
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data,
  };

  try {
    const response = await axios(config);
    return response; // Return response data instead of the full response
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "An error occurred");
    } else {
      throw new Error("Network error");
    }
  }
};

export default apiRequest;
