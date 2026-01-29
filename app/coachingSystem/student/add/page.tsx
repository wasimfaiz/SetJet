// pages/employee/add.tsx
"use client";
import AddEdit from "@/app/components/addedit";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/app/utils/apiClient";

const StudentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState({});

  const studentFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
      required: true,
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "phoneNumber",
      required: true,
    },
    {
      label: "Email",
      name: "email",
      type: "text",
    },
    {
      label: "D.O.B.",
      name: "dob",
      type: "date",
      required: true,
    },
    {
      label: "Address",
      name: "address",
      type: "text",
      required: true,
    },
    {
      label: "Parent's mobile",
      name: "parentPhoneNumber",
      type: "phoneNumber",
    },
    {
      label: "Reg. Date",
      name: "regDate",
      type: "date",
      required: true,
    },
    {
      label: "Aadhaar Card",
      name: "aadhar",
      type: "file",
      folder: "CoachingManagementSystem/StudentDetails"
    },
  ];
  
useEffect(() => {
  const fetchStudentData = async () => {
    if (id) {
      const response = await apiClient.get(`/api/students?id=${id}`);
      const student = Array.isArray(response.data) ? response.data[0] : response.data;
      setInitialData(student);
    }
  };
  fetchStudentData();
}, [id]);

const handleFormSubmit = async (formData: any) => {
  try {
    if (id) delete formData._id;

    // 1. Save student first
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/students?id=${id}` : "/api/students";

    const studentResponse = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!studentResponse.ok) {
      const err = await studentResponse.json();
      throw new Error(err.error || "Failed to save student");
    }

    const studentResult = await studentResponse.json();

    // Get correct student ID (adjust according to what your API returns)
    const createdStudentId = id || studentResult._id || studentResult.insertedId;

    // 2. If slot is selected → directly create booking
    if (formData.selectedSlotId) {
      const payload = {
        course: formData.course || "Manual Admission",
        slotId: formData.selectedSlotId,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email || "",
        // Fake/offline payment details (no real payment)
        paymentDetails: {
          method: "OFFLINE / CASH / MANUAL",
          amount: 0,
          status: "success",
          transactionId: `MANUAL-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      };

      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (bookingResponse.ok) {
        console.log("Booking created successfully for manual student");
      } else {
        const bookingError = await bookingResponse.json();
        console.warn("Booking failed (but student was saved):", bookingError);
        // You can show a warning toast here if you have one
      }
    }

    router.push("/coachingSystem/student");
  } catch (err) {
    console.error("Submission failed:", err);
    alert("Error saving student. Please try again.");
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
      {/* @ts-ignore */}
      <AddEdit fields={studentFields} onSubmit={handleFormSubmit} initialData={initialData}/>
    </div>
  );
};

const StudentAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentPage />
    </Suspense>
  );
};

export default StudentAddPage;
