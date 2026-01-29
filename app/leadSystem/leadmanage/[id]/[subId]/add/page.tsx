"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddEdit from "@/app/components/addedit";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import apiClient from "@/app/utils/apiClient";

const ContactAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
    const { employeeId, employeeName } = useEmployeeContext();
  
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
      type: "phoneNumber",
      placeholder: "Mobile",
      required: true
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
      label: "Apply for Country",
      name: "country",
      type: "select",
      placeholder: "Country",
      options:[
        { value: "AUSTRALIA", label: "AUSTRALIA" },
        { value: "AUSTRIA", label: "AUSTRIA" },
        { value: "BANGLADESH", label: "BANGLADESH" },
        { value: "BHUTAN", label: "BHUTAN" },
        { value: "CANADA", label: "CANADA" },
        { value: "CHINA", label: "CHINA" },
        { value: "FINLAND", label: "FINLAND" },
        { value: "GEORGIA", label: "GEORGIA" },
        { value: "GERMANY", label: "GERMANY" },
        { value: "INDIA", label: "INDIA" },
        { value: "ITALY", label: "ITALY" },
        { value: "LUXEMBOURG", label: "LUXEMBOURG" },
        { value: "MALTA", label: "MALTA" },
        { value: "NEPAL", label: "NEPAL" },
        { value: "NEW ZEALAND", label: "NEW ZEALAND" },
        { value: "RUSSIA", label: "RUSSIA" },
        { value: "SINGAPORE", label: "SINGAPORE" },
        { value: "SWEDEN", label: "SWEDEN" },
        { value: "SWITZERLAND", label: "SWITZERLAND" },
        { value: "UK", label: "UK" },
        { value: "USA", label: "USA" },
        { value: "MAURITIUS", label: "MAURITIUS" }   
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
      label: "Lead Category",
      name: "leadCategory",
      type: "select",
      initialValue: true,
      placeholder: "Category",
      options:[
        { value: "GROUND", label: "GROUND LEAD" },
        { value: "WALKING", label: "WALKING LEAD" },
      ],      
    },
    {
      label: "Status",
      name: "status",
      type: "select",
      options: [
        { label: "CONVERTED", value: "CONVERTED"},
        { label: "PAYMENT MODE", value: "PAYMENT MODE"},
        { label: "INTERESTED", value: "INTERESTED" },
        { label: "NOT INTERESTED", value: "NOT INTERESTED" },
        { label: "DNP", value: "DNP" },
        { label: "FOLLOW UP", value: "FOLLOW UP" },
        { label: "SWITCH OFF", value: "SWITCH OFF" },
        { label: "CALL DISCONNECTED", value: "CALL DISCONNECTED" },
        { label: "OTHERS", value: "OTHERS" },
      ],
    },
    {
      label: "Looking for",
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
  useEffect(() => {
  }, [employeeId]);
  // Form submit handler
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      console.log(id);
      
      if (id) {
        delete data._id;
      }
  
      // Set default value for leadCategory if it doesn't exist
      if (!data.leadCategory) {
        data.leadCategory = "GROUND";
      }
  
      data.by = {
        employeeId: employeeId,
        employeeName: employeeName,
      };
  
      const payload = data;
      const method = id ? "PUT" : "POST"; // Use PUT for edit, POST for add
      const url = id
        ? `/api/leads/student-leads?id=${id}`
        : "/api/leads/student-leads";
  
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const leadsPayload = {
        employeeId: employeeId,
        employeeName: employeeName,
      };
  
      await apiClient.post(`/api/leads`, leadsPayload);
  
      if (response.ok) {
        const result = await response.json();
        console.log("Form Data Submitted Successfully:", result);
        router.back(); // Redirect after successful submission
      } else {
        const errorData = await response.json();
        alert("Duplicate phone number");
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
