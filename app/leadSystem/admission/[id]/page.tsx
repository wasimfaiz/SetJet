"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const AdmissionViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const admissionFields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "College Name",
      value: "collegeName",
    },
    {
      label: "Looking For",
      value: "courseName",
    },
    {
      label: "Stream",
      value: "streamName",
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
      label: "Message",
      value: "message",
    },
    {
      label: "Called at",
      value: "calledAt",
      type: "dateArray",
    },
    { label: "Status", value: "status", type: "text" },
    { label: "Looking for", value: "course", type: "text" },
    { label: "Remark", value: "remark", type: "dateArray" },
  ];

  const fetchAdmission = async (id: any) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/admission?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching admission data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAdmission(id);
    }
  }, [id]);

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
        <View item={selectedItem} fields={admissionFields} />
      ) : (
        <p>No admission found</p>
      )}
    </div>
  );
};

export default AdmissionViewPage;
