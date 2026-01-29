"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import { checkButtonVisibility, formatDateTime } from "@/app/utils/helperFunc";
import Table from "@/app/components/table";
import { usePermissions } from "@/app/contexts/permissionContext";
import apiClient from "@/app/utils/apiClient";

const UserViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { permissions } = usePermissions();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [colleges, setColleges] = useState(null)
  const [error, setError] = useState<string | null>(null);

  const columns = [
    { header: "College Name", accessor: "name", type: "text" },
    { header: "Country", accessor: "country", type: "text" },
    { header: "State", accessor: "state", type: "text" },
    { header: "City", accessor: "city", type: "text" },
    { header: "Published", accessor: "publish", type: "boolean" },
  ];

  const fetchUser = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/users?id=${id}`);
      setUser(response.data);
      fetchCollege(response?.data?.wishlist)
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCollege = async (ids : any) => {
    setLoading(true);
      try {
      //@ts-ignore
      const response = await apiClient.get(`/api/college?ids=${ids}`);
      setColleges(response.data?.colleges);
      } catch (err) {
      setError("Failed to load colleges.");
      console.error("Error loading colleges:", err);
      } finally {
      setLoading(false);
      }
    }
  const handleView = (item: any) => {
    router.push(`/leadSystem/college/${item._id}`);
  };
  const renderActions = (item: any) => (    
    <>
      <button className="underline hover:text-bloodred" onClick={() => handleView(item)}>
        {item?.courseCount} Courses
      </button>
      <button className="relative w-[100px] h-[60px]" onClick={() => handleOverView(item)}>
        <img
          src={item?.img || "/university.png"}
          alt="university"
          className="object-cover rounded-md w-full h-[60px]"
        />
        <div className="absolute inset-0 flex items-center justify-center text-white hover:bg-opacity-50 bg-black bg-opacity-20 rounded-md">
          Overview
        </div>
      </button>
    </>
  );
  const handleOverView = (item: any) => {
    router.push(`/leadSystem/college/${item._id}/view`);
  };
  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="container mx-auto mt-10">
        <button
          className="text-blue-500 underline hover:text-deepblue cursor-pointer mb-4"
          onClick={() => router.back()}
        >
          Back
        </button>
        <p className="text-center text-gray-500">No user found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-10 p-6">
      <div className="mb-6">
      <button
          className="text-blue-500 underline hover:text-blue-700 mb-2"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        {/* User Header */}
        <div className="flex flex-col md:flex-row justify-between border-b pb-6 mb-8 rounded-lg shadow-sm p-6">
          {/* Left panel with its own relative container */}
          <div className="relative flex-1 md:mr-6 rounded-lg overflow-hidden">
            <img
              src="/pattern.jpg"
              alt="Background Pattern"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative z-10 p-4">
              <h2 className="text-lg font-semibold text-gray-800">Name</h2>
              <p className="text-base text-gray-600">{user.name || "N/A"}</p>
              <h2 className="text-lg font-semibold text-gray-800 mt-3">Phone Number</h2>
              <p className="text-sm text-gray-600">{user.phoneNumber || "N/A"}</p>
            </div>
          </div>
          {/* Right panel for the button, unaffected by the bg image */}
          {checkButtonVisibility(permissions, "userAdmission", "add") && (
            <div className="flex-shrink-0 mt-4 md:mt-0">
              <button
                className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white rounded-lg text-xs md:text-sm lg:text-base px-4 py-1 md:px-6 md:py-2 lg:px-8 lg:py-3 z-20"
                onClick={() => {router.push(`/leadSystem/user/edit?id=${user._id}`)}}
              >
                Manage Applications
              </button>
            </div>
          )}
        </div>
        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">email</h3>
            <p className="mt-1 text-sm font-semibold">
              {user.email}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Country</h3>
            <p className="mt-1 text-sm font-semibold">{user.details?.country || "N/A"}</p>
          </div>
            <div>
            <h3 className="text-sm font-medium text-gray-500">Intake</h3>
            <p className="mt-1 text-sm font-semibold">
              {user.details?.intake || "N/A"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Pursue</h3>
            <p className="mt-1 text-sm font-semibold">
              {user.details?.pursue || "N/A"}
            </p>
          </div>
           <div>
            <h3 className="text-sm font-medium text-gray-500">Education</h3>
            <p className="mt-1 text-sm">{user.details?.education || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Percentage</h3>
            <p className="mt-1 text-sm">{user.details?.percentage || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Passport</h3>
            <p className="mt-1 text-sm">{user.details?.passport || "N/A"}</p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Course</h3>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {user.details?.course || "No remarks available."}
            </p>
          </div>
        </div>
      </div>
    {/* College Table */}
    <div className="my-5 px-2">
      <Table
      //@ts-ignore
        data={colleges}
        //@ts-ignore
        columns={ columns }
        actions={renderActions}
        handleView={handleView}
      />
    </div>
    </div>
  );
};

export default UserViewPage;
