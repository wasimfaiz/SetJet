// app/college/[collegeId]/course/[courseId]/courses/view/page.tsx
"use client";

import View from "@/app/components/view";
import { useParams, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";

const CollegeViewPage: React.FC = () => {
  const { collegeId, courseId, subCourseId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  // All existing plus new fields
  const collegeFields = [
    { label: "Name", value: "name" },
    { label: "Eligibility", value: "eligibility" },
    { label: "Application Date", value: "applicationDate", type: "date" },
    { label: "Duration", value: "duration" },
    { label: "Intake month", value: "intake" },
    { label: "Application Fee", value: "applicationFee" },
    { label: "Admission Charges", value: "admissionCharges" },
    { label: "ERP (Per Year)", value: "erpFee" },
    { label: "Library / Medical Consultation Fee", value: "libraryMedicalFee" },
    { label: "Internal Exam Fee", value: "internalExamFee" },
    { label: "Tuition Fees (Per Year)", value: "tuitionFeePerYear" },
    { label: "Total Fees (Per Year)", value: "totalFeePerYear" },
    { label: "Registration Fee", value: "registrationFee" },
    { label: "Academic Fee", value: "academicFee" },
    { label: "Soft Skills", value: "softSkills" },
    { label: "Unit Fee", value: "unitFee" },
    { label: "Total Fee (Full Course)", value: "totalFeeFullCourse" },
    { label: "Degree Applying for (UG/PG/PHD)", value: "degree" },
    // New multi-select Admission Documents
    { label: "Admission Documents", value: "admissionDoc", type: "array" },
    // New: Career
    { label: "Career", value: "career" },
    // New: Scholarship
    { label: "Scholarship", value: "scholarship" },
    // New: Average CTC
    { label: "Average CTC", value: "avgCtc" },
    // Semester fees
    { label: "Semester Fees", value: "semester", type: "dateArray" },
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const resp = await apiClient.get(
          `/api/college/${collegeId}/course/${courseId}/courses?subCourseId=${subCourseId}`
        );
        setData(resp.data.subCourse);
      } catch (err) {
        console.error("Error fetching course data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [collegeId, courseId, subCourseId]);

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-4">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4"
        onClick={() => router.back()}
      >
        Back
      </button>
      {/* @ts-ignore */}
      <View item={data} fields={collegeFields} />
    </div>
  );
};

export default CollegeViewPage;
