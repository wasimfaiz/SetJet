"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import AddEdit from "@/app/components/addedit";
import axios from "axios";
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
  const contactFields =  [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "text",
      placeholder: "Mobile",
    },
    {
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "Email",
    },
    {
      label: "Date",
      name: "date",
      type: "date",
      placeholder: "Date",
    },
    {
      label: "10th Percentage",
      name: "tenthPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "12th Percentage",
      name: "twelfthPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "UG Percentage",
      name: "ugPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "PG Percentage",
      name: "pgPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "Apply for Course",
      name: "course",
      type: "select",
      options: [
        { label: "BACHELORS", value: "BACHELORS" },
        { label: "MASTERS", value: "MASTERS" },
        { label: "MBA", value: "MBA" },
        { label: "MBBS", value: "MBBS" },
        { label: "MEDICAL", value: "MEDICAL" },
        { label: "SPOKEN ENGLISH", value: "SPOKEN ENGLISH" },
        { label: "IELTS COURSE", value: "IELTS COURSE" },
        { label: "TESTAS COURSE", value: "TESTAS COURSE" },
        { label: "GERMAN LANGUAGE COURSE", value: "GERMAN LANGUAGE COURSE" },
        { label: "WORKING VISA", value: "WORKING VISA" },
        { label: "OTHERS", value: "OTHERS" },
      ],
    },
    {
      label: "Apply for Country",
      name: "country",
      type: "select",
      placeholder: "Country",
      options:[
        { value: "USA", label: "USA" },
        { value: "CANADA", label: "CANADA" },
        { value: "UK", label: "UK" },
        { value: "FINLAND", label: "FINLAND" },
        { value: "MALTA", label: "MALTA" },
        { value: "LUXEMBOURG", label: "LUXEMBOURG" },
        { value: "CHINA", label: "CHINA" },
        { value: "NEPAL", label: "NEPAL" },
        { value: "BANGLADESH", label: "BANGLADESH" },
        { value: "BHUTAN", label: "BHUTAN" },
        { value: "NEW ZEALAND", label: "NEW ZEALAND" },
        { value: "SINGAPORE", label: "SINGAPORE" },
        { value: "SWITZERLAND", label: "SWITZERLAND" },
        { value: "SWEDEN", label: "SWEDEN" },
        { value: "GERMANY", label: "GERMANY" },
        { value: "GEORGIA", label: "GEORGIA" },
        { value: "AUSTRIA", label: "AUSTRIA" },
        { value: "AUSTRALIA", label: "AUSTRALIA" },
        { value: "RUSSIA", label: "RUSSIA" },
        { value: "ITALY", label: "ITALY" }
      ],      
    },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
      ],
    },
    {
      label: "Counseller name",
      name: "counsellorName",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Address",
      name: "address",
      type: "textarea",
      placeholder: "Address",
    },
    {
      label: "Profile picture",
      name: "profilePic",
      type: "file",
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
        const response = await apiClient.get(
          `/api/leads/student-leads?id=${id}`
        );
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
      const method = "PUT";
      const url = `/api/leads/student-leads?id=${id}`;
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
        router.back();
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
      <AddEdit
        fields={contactFields}
        initialData={initialData}
        onSubmit={handleFormSubmit}
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