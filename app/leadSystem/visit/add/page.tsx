// pages/visit/add.tsx
"use client";
import AddEdit from "@/app/components/addedit";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const VisitAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const employeeFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
      required: true,
    },
    {
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "Email",
      required: true,
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "text",
      placeholder: "Mobile",
      required: true,
    },
    {
      label: "Date",
      name: "date",
      type: "date",
      placeholder: "Date",
      required: true,
    },
    {
      label: "Slot",
      name: "time",
      type: "select",
      options: [
        { value: "10:00 AM", label: "10:00 AM" },
        { value: "11:00 AM", label: "11:00 AM" },
        { value: "12:00 PM", label: "12:00 PM" },
        { value: "1:00 PM", label: "1:00 PM" },
        { value: "2:00 PM", label: "2:00 PM" },
        { value: "3:00 PM", label: "3:00 PM" },
        { value: "4:00 PM", label: "4:00 PM" },
        { value: "5:00 PM", label: "5:00 PM" },
        { value: "6:00 PM", label: "6:00 PM" },
      ],
      required: true,
    },
    {
      label: "Address",
      name: "address",
      type: "select",
      options: [
        { value: "BIHAR", label: "Bihar" },
        { value: "DEHRADUN", label: "Dehradun" },
        { value: "GUJARAT", label: "Gujarat" },
      ],
      required: true,
    },
    {
      label: "Action taken",
      name: "action",
      type: "select",
      options: [
        { value: "CONTACTED", label: "Contacted" },
        { value: "PENDING", label: "Pending" },
        { value: "SPAM", label: "Spam" },
      ],
      required: true,
    },
  ];
  // Setup react-hook-form with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(contacts), // Use the Yup schema
  });

  useEffect(() => {
    const fetchVisitData = async () => {
      if (id) {
        setLoading(true);
        try {
          const response = await apiClient.get(`/api/visit?id=${id}`);
          setInitialData(response.data);
        } catch (error) {
          console.error("Error fetching visit data:", error);
        }
      }
      setLoading(false); // Set loading to false after data fetch
    };
    fetchVisitData();
  }, [id]);

  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }

      const payload = data;
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/visit?id=${id}` : "/api/visit";
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
        router.push("/leadSystem/enquiry");
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if(loading){
    return<Loader />
  }
  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
      <AddEdit
        fields={employeeFields}
        initialData={initialData}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
const VisitAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VisitAddPageContent />
    </Suspense>
  );
};
export default VisitAddPage;
