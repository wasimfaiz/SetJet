"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddEdit from "@/app/components/addedit";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import apiClient from "@/app/utils/apiClient";

const ContactAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState(null);

  // Define form fields
  const contactFields = [
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
    const fetchContactData = async () => {
      if (id) {
        const response = await apiClient.get(`/api/contact?id=${id}`);
        setInitialData(response.data);
        reset(response.data); // Reset form with initial data
      }
    };
    fetchContactData();
  }, [id, reset]);

  // Form submit handler
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }
      const payload = data;
      const method = initialData ? "PUT" : "POST"; // Use PUT for edit, POST for add
      const url = initialData ? `/api/contact?id=${id}` : "/api/contact";
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
        router.push("/leadSystem/enquiry"); // Redirect after successful submission
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
        fields={contactFields}
        initialData={initialData}
        onSubmit={handleFormSubmit} // handleSubmit from react-hook-form
      />
    </div>
  );
};

const ContactAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactAddPageContent />
    </Suspense>
  );
};

export default ContactAddPage;
