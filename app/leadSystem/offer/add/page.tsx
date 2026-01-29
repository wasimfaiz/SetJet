// pages/offer/add.tsx
"use client";
import AddEdit from "@/app/components/addedit";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import apiClient from "@/app/utils/apiClient";

const OfferAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Retrieve the offer ID from URL query
  const [initialData, setInitialData] = useState(null); // State to hold fetched data

  // Define the fields for the offer form
  const offerFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
      required: true,
    },
    {
      label: "Off",
      name: "off",
      type: "number",
      placeholder: "Off",
      required: true,
    },
    {
      label: "Valid from",
      name: "startDate",
      type: "date",
      placeholder: "Valid from",
      required: true,
    },
    {
      label: "Valid till",
      name: "endDate",
      type: "date",
      placeholder: "Valid till",
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

  // Fetch offer data if editing an existing offer
  useEffect(() => {
    const fetchOfferData = async () => {
      if (id) {
        const response = await apiClient.get(`/api/offers?id=${id}`);
        setInitialData(response.data);
        reset(response.data); // Pre-fill the form with existing offer data
      }
    };
    fetchOfferData();
  }, [id, reset]);

  // Handle form submission
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id; // Remove the _id field when updating
      }

      const payload = data;
      const method = id ? "PUT" : "POST"; // Use PUT for updating, POST for creating
      const url = id ? `/api/offers?id=${id}` : "/api/offers";
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
        router.push("/leadSystem/offer"); // Redirect to offers page after successful submission
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
        onClick={() => router.back()}
      >
        Back
      </button>
      <AddEdit
        fields={offerFields}
        initialData={initialData} // Pre-fill form with existing data if editing
        onSubmit={handleFormSubmit} // Submit handler
      />
    </div>
  );
};
const OfferAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfferAddPageContent />
    </Suspense>
  );
};
export default OfferAddPage;
