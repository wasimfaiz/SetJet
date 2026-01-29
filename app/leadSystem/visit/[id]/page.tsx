"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const VisitViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const fields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Email",
      value: "email",
    },
    {
      label: "Mobile",
      value: "phoneNumber",
    },
    {
      label: "Date",
      value: "date",
    },
    {
      label: "Slot",
      value: "time",
      options: [{ value: "45 mins", label: "45 mins" }],
    },
    {
      label: "Address",
      value: "address",
      options: [
        { value: "BIHAR", label: "Bihar" },
        { value: "DEHRADUN", label: "Dehradun" },
        { value: "GUJRAT", label: "Gujrat" },
      ],
    },
    {
      label: "Action taken",
      value: "action",
    },
    {
      label: "Called at",
      value: "calledAt",
      type: "dateArray",
    },
    { label: "Looking for", value: "course", type: "text" },
    { label: "Remark", value: "remark", type: "dateArray" },
  ];

  // Function to fetch visit data by ID
  const fetchVisit = async (id: any) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/visit?id=${id}`); // Adjust the API endpoint as needed
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching visit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVisit(id); // Fetch visit data when the component mounts
    }
  }, [id]);

  // Show a loading message while fetching data
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer"
        onClick={() => {
          router.back();
        }}
      >
        Back
      </button>
      {selectedItem ? (
        //@ts-ignore
        <View item={selectedItem} fields={fields} />
      ) : (
        <p>No visit found</p>
      )}
    </div>
  );
};

export default VisitViewPage;
