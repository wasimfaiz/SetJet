"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";
const fields = [
  {
    label: "Job Title",
    value: "title",
  },
  {
    label: "Location",
    value: "location",
  },
  {
    label: "Salary",
    value: "salary",
  },
  {
    label: "Job Type",
    value: "jobType",
  },
  {
    label: "Description",
    value: "desc",
  },
];

const JobViewPage = () => {
  const { permissions } = usePermissions();
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const fetchJobs = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/jobs?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching formatdata:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/job/add?id=${item._id}`);
  };
  useEffect(() => {
    if (id) {
      fetchJobs(id);
    }
  }, [id]);
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
      <View
        item={selectedItem}
        fields={fields}
        handleEdit={
          checkButtonVisibility(permissions, "job", "edit")
            ? handleEdit
            : undefined
        }
      />
    </div>
  );
};

export default JobViewPage;
