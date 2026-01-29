"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEmployeeContext } from "../contexts/employeeContext";
import apiClient from "../utils/apiClient";
import { useTokenCheck } from "../hooks/useTokenCheck";

const Profile = () => {

/* useTokenCheck(); */ // protects this page

  const { employeeId } = useEmployeeContext();
  
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

useEffect(() => {
  const fetchEmployeeDetails = async () => {
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    if (!email || !role) {
      router.push("/employee-login");
      return;
    }

    try {
      let response;
      if (role === "EMPLOYEE") {
        response = await apiClient.get(`/api/employees?email=${email}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUserDetails(response.data);
      } else if (role === "ADMIN") {
        response = await apiClient.get(`/api/auth/admin/login?email=${email}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUserDetails(response.data.admin);
      }
      setLoading(false);// Stop loading once data is fetched
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError("Failed to load profile.");
      setLoading(false);// Stop loading even if there is an error

      // Only redirect on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        router.push("/");// Redirect to login if there is an error
      }
    }
  };

  fetchEmployeeDetails();
}, [router]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return <div className="container">{error}</div>;
  }
  return (
<div className="container flex flex-col items-center">
  <div className="bg-white shadow-md rounded-lg md:p-6 p-2 w-full mx-2">
    <div className="flex items-center gap-2">
      <img
        src={userDetails?.basicField?.profilePic || "/profilepic.png"}
        alt="Profile Picture"
        className="md:w-20 md:h-20 w-10 h-10 rounded-full"
      />
      <div>
        <h2 className="md:text-xl text-base font-semibold md:mb-1">
          {userDetails?.basicField?.name || userDetails?.email}
        </h2>
        <p className="text-gray-600 md:text-base text-[10px]">
          {userDetails?.basicField?.role || "ADMIN"}
        </p>
      </div>
    </div>
    <div className="border border-gray-300 my-2"></div>

    {userDetails?.basicField?.role === "EMPLOYEE" && (
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <strong className="text-xs md:text-sm">Email</strong>
            <span className="text-gray-600 text-xs md:text-sm">
              {userDetails?.basicField?.email}
            </span>
          </div>
          <div className="flex flex-col">
            <strong className="text-xs md:text-sm">Mobile</strong>
            <span className="text-gray-600 text-xs md:text-sm">
              {userDetails?.basicField?.phoneNumber}
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <strong className="text-xs md:text-sm">Job Role</strong>
            <span className="text-gray-600 text-xs md:text-sm">
              {userDetails?.basicField?.jobRole}
            </span>
          </div>
        </div>
      </div>
    )}
    <strong className="block mt-4 text-xs md:text-sm">Permissions</strong>

    {userDetails?.permissions !== "all" ? (
      <div className="overflow-x-auto my-3">
        <table className="table-auto border-collapse border border-gray-300 w-full text-left mt-3 text-xs md:text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-green-900 to-parrotgreen text-white">
              <th className="border border-gray-300 px-2 py-1">Tab</th>
              <th className="border border-gray-300 px-2 py-1 text-center">
                View
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center">
                Add
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center">
                Edit
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center">
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {userDetails?.permissions &&
              Object.entries(userDetails.permissions).map(
                ([tab, actions]) => (
                  <tr key={tab}>
                    <td className="border border-gray-300 px-2 py-1 capitalize text-xs md:text-sm">
                      {tab === "database" ? "Database Management" : tab}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {/* @ts-ignore */}
                      {actions.includes("view") ? "✔️" : "❌"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {/* @ts-ignore */}
                      {actions.includes("add") ? "✔️" : "❌"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {/* @ts-ignore */}
                      {actions.includes("edit") ? "✔️" : "❌"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {/* @ts-ignore */}
                      {actions.includes("delete") ? "✔️" : "❌"}
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="mt-3 text-xs md:text-sm">All</div>
    )}
  </div>
</div>

  );
};

export default Profile;
