"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddEdit from "@/app/components/addedit";
import axios from "axios";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loader from "@/app/components/loader";
import { boolean } from "yup";
import apiClient from "@/app/utils/apiClient";
const FormatAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  // Define form fields
  const formatFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
      required: true,
    },
    {
      label: "Drive link",
      name: "link",
      type: "text",
      placeholder: "Drive link",
      required: true,
    },
    {
      label: "Pdf Upload",
      name: "pdf",
      type: "file",
      placeholder: "File",
      required: true,
      folder:"DocumentFormat"
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
    const fetchContactData = async () => {
      if (id) {
        setLoading(true);
        try{
        const response = await apiClient.get(`/api/format?id=${id}`);
        setInitialData(response.data);
        reset(response.data); // Reset form with initial data
        setLoading(false);
      }catch(error){
        console.log("Error fetching data:", error)
      }finally{
        setLoading(false);
      }
    }
    };
    fetchContactData();
  }, [id, reset]);
  if(loading){
    return <Loader />
  }

  // Form submit handler
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }
      const payload = data;
      const method = initialData ? "PUT" : "POST"; // Use PUT for edit, POST for add
      const url = initialData ? `/api/format?id=${id}` : "/api/format";
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
        router.push("/leadSystem/format"); // Redirect after successful submission
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

      {/* Form component (AddEdit) */}
      <AddEdit
        //@ts-ignore
        fields={formatFields}
        initialData={initialData}
        onSubmit={handleFormSubmit} // handleSubmit from react-hook-form
      />
    </div>
  );
};

const FormatAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormatAddPageContent />
    </Suspense>
  );
};

export default FormatAddPage;
