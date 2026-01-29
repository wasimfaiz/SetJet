"use client";
import AddEdit from "@/app/components/addedit";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import { employeeAddFields } from "@/app/constants/fields";
const EmployeeAddPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [activeAccordion1, setActiveAccordion1] = useState<boolean>(false);
  const [activeAccordion2, setActiveAccordion2] = useState<boolean>(false);
  const [activeAccordion3, setActiveAccordion3] = useState<boolean>(false); 
  const [activeAccordion4, setActiveAccordion4] = useState<boolean>(false); 
  const [activeAccordion5, setActiveAccordion5] = useState<boolean>(false);     
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);

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
        setLoading(true); // Set loading state to true before fetching
        try {
          const response = await apiClient.get(`/api/employees?id=${id}`);
          setInitialData(response?.data);
          setLoading(false); // Set loading to false after data is fetched
        } catch (error) {
          console.error("Error fetching employee data:", error);
          setLoading(false); // Ensure loading is set to false even on error
        }
      }
    
      
    };
    fetchContactData();
  }, [id, reset]);

  if(loading){
    return <Loader />
  }

  // API call for personal details using POST
  const handleBasicFormSubmit = async (data: any) => {
    try {
      if (id) {
        // Handle update with employeeId if editing
        data.employeeId = employeeId; // Make sure employeeId is part of the payload
        delete data._id;
      }
  
      const payload = data;
      const method = initialData ? "PUT" : "POST"; // Use PUT for editing and POST for creating
      const url = initialData ? `/api/employees?id=${id}` : "/api/employees";
  
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const result = await response.json();
        setEmployeeId(result.employeeId); // Store employeeId on successful creation
        alert("Employee details added/updated successfully");
      } else {
        alert("Failed to create/update employee");
      }
    } catch (error) {
      console.error("Error creating/updating employee:", error);
    }
  };

  // API call for bank details using PUT
  const handleBankFormSubmit = async (data: { [key: string]: any }) => {
    delete data._id
    try {
      const url = id
      ? `/api/employees?id=${id}`
      : `/api/employees?id=${employeeId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log("Bank form updated successfully");
        alert("Bank form updated successfully");
        setActiveAccordion2(false);
      } else {
        console.log("Failed to update bank form");
      }
    } catch (error) {
      console.error("Error updating bank form:", error);
    }
  };

  // API call for document details using PUT
  const handleDocFormSubmit = async (data: { [key: string]: any }) => {
    delete data._id
    try {
      const url = id
      ? `/api/employees?id=${id}`
      : `/api/employees?id=${employeeId}`;
      const response = await fetch(url, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log("Documents form updated successfully");
        alert("Documents form updated successfully");
        setActiveAccordion3(false);
      } else {
        console.log("Failed to update documents form");
      }
    } catch (error) {
      console.error("Error updating documents form:", error);
    }
  };

  // API call for company document details using PUT
  const handleCompDocFormSubmit = async (data: { [key: string]: any }) => {
    delete data._id
    try {
      const url = id
      ? `/api/employees?id=${id}`
      : `/api/employees?id=${employeeId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log("Company documents form updated successfully");
        alert("Company documents form updated successfully");
        setActiveAccordion4(false);
      } else {
        console.log("Failed to update documents form");
      }
    } catch (error) {
      console.error("Error updating documents form:", error);
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
      {/* Accordion 1: Personal Details */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion1(true)}
        >
          <span>1. Employee Details</span>
          <span>{activeAccordion1 ? "▲" : "▼"}</span>
        </button>
        {activeAccordion1 && (
          <div className="p-4">
            <AddEdit
              //@ts-ignore
              fields={employeeAddFields.basicFields}
              onSubmit={handleBasicFormSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>

      {/* Accordion 2: Bank Details */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion2(true)}
        >
          <span>2. Bank Details</span>
          <span>{activeAccordion2 ? "▲" : "▼"}</span>
        </button>
        {activeAccordion2 && (
          <div className="p-4">
            <AddEdit
              fields={employeeAddFields.bankFields}
              onSubmit={handleBankFormSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>

      {/* Accordion 3: Documents */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion3(true)}
        >
          <span>3. Onboarding Documents</span>
          <span>{activeAccordion3 ? "▲" : "▼"}</span>
        </button>
        {activeAccordion3 && (
          <div className="p-4">
            <AddEdit
              fields={employeeAddFields.docFields}
              onSubmit={handleDocFormSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>

      {/* Accordion 4: Company Documents */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion4(true)}
        >
          <span>4. Europass Documents</span>
          <span>{activeAccordion4 ? "▲" : "▼"}</span>
        </button>
        {activeAccordion4 && (
          <div className="p-4">
            <AddEdit
              fields={employeeAddFields.companyFields}
              onSubmit={handleCompDocFormSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>

      {/* Accordion 5: Company Documents */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion5(true)}
        >
          <span>5. Salary Structure</span>
          <span>{activeAccordion5 ? "▲" : "▼"}</span>
        </button>
        {activeAccordion5 && (
          <div className="p-4">
           <span className="py-2 text-lg">Earnings</span> 
            <AddEdit
              fields={employeeAddFields.salaryFields}
              onSubmit={handleCompDocFormSubmit}
              initialData={initialData}
            />
            <span className="py-2 text-lg">Deductions</span>
            <AddEdit
              fields={employeeAddFields.taxFields}
              onSubmit={handleCompDocFormSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeAddPage />
    </Suspense>
  );
};

export default EmployeePage;