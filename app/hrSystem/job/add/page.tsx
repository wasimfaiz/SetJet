// pages/employee/add.tsx
"use client";
import AddEdit from "@/app/components/addedit";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";

const JobPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState([]);

  const jobFields = [
    {
      label: "Job Title",
      name: "title",
      type: "text",
      placeholder: "Job Title",
      required: true,
    },
    {
      label: "Location",
      name: "location",
      type: "select",
      required: true,
      options: [
        { value: "BIHAR", label: "BIHAR" },
        { value: "DEHRADUN", label: "DEHRADUN" },
      ],
    },
    {
      label: "Salary",
      name: "salary",
      type: "text",
      placeholder: "Salary",
      required: false,
    },
    {
      label: "Job Type",
      name: "jobType",
      type: "select",
      options: [
        { value: "FULL_TIME", label: "Full Time" },
        { value: "PART_TIME", label: "Part Time" },
        { value: "CONTRACT", label: "Contract" },
        { value: "INTERNSHIP", label: "Internship" },
      ],
      required: true,
    },
    {
      label: "Description",
      name: "desc",
      type: "textarea",
      placeholder: "Job Description",
      required: true,
    },
  ];
  useEffect(() => {
    const fetchJobData = async () => {
      if (id) {
        const response = await apiClient.get(`/api/jobs?id=${id}`);
        setInitialData(response.data);
      }
    };
    fetchJobData();
  }, [id]);


  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }
      const payload = data;
      const method = id ? "PUT" : "POST"; // Use PUT for edit, POST for add
      const url = id ? `/api/jobs?id=${id}` : "/api/jobs";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Form Data Submitted Successfully:", result);
        router.push("/leadSystem/job"); // Redirect after successful submission
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => {
          router.back();
        }}
      >
        Back
      </button>
      <AddEdit fields={jobFields} onSubmit={handleFormSubmit} initialData={initialData}/>
    </div>
  );
};

const JobAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobPage />
    </Suspense>
  );
};

export default JobAddPage;
