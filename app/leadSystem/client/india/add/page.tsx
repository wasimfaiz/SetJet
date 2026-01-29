"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { contacts } from "@/app/utils/validation.utils";
import apiClient from "@/app/utils/apiClient";
import AddEdit from "@/app/components/addedit";

const ClientAddPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [activeAccordion1, setActiveAccordion1] = useState<boolean>(false);
  const [activeAccordion2, setActiveAccordion2] = useState<boolean>(false);
  const [activeAccordion3, setActiveAccordion3] = useState<boolean>(false);
  const [activeAccordion4, setActiveAccordion4] = useState<boolean>(false);
  const [activeAccordion5, setActiveAccordion5] = useState<boolean>(false);
  const [activeAccordion6, setActiveAccordion6] = useState<boolean>(false);
  const [activeAccordion7, setActiveAccordion7] = useState<boolean>(false);
  const [activeAccordion8, setActiveAccordion8] = useState<boolean>(false);
  const [viewFields, setViewFields] = useState<boolean>(false);

  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState(null);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [stateData, setStateData] = useState<any[]>([]);

  const studentInfo = [
    { label: "Name", name: "studentInfo.name", type: "text", required: true },
    { label: "Email", name: "studentInfo.email", type: "text", required: true },
    { label: "Contact Number", name: "studentInfo.contact", type: "phoneNumber", required: true },
    { label: "Parent's Number", name: "studentInfo.parentContact", type: "phoneNumber", required: true },
    {
      label: "D.O.B",
      name: "studentInfo.dob",
      type: "date",
    },
    { label: "Registration Number", name: "studentInfo.regNo", type: "text", required: true },
    { label: "Registration Date", name: "studentInfo.regDate", type: "date", required: true },
    {
      label: "Registration Office",
      name: "studentInfo.regOffice",
      type: "select",
      options: [
        { value: "BIHAR", label: "BIHAR" },
        { value: "DEHRADUN", label: "DEHRADUN" },
      ],
      required: true,
    },
    { label: "Gender", name: "studentInfo.gender", type: "select", required: true, options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" }
      ]
    },
    { label: "Degree Applying for (UG/PG/PHD)", name: "studentInfo.degree", type: "select", required: true, options: [
      { value: "UG", label: "UG" },
      { value: "PG", label: "PG" },
      { value: "PHD", label: "PHD" },
    ], },
    { label: "Country Applying for", name: "personalInfo.countryApplyingFor", type: "select", required: true, options: [{ value: "INDIA", label: "INDIA"}, {value: "OTHERS", label: "OTHERS" }] },

    { label: "State Applying for", name: "personalInfo.stateApplyingFor", type: "select", options: stateData, required: true,
      dependsOn: { field: "personalInfo.countryApplyingFor", value: "INDIA" }
    },
    { label: "State Applying for", name: "personalInfo.stateApplyingFor", type: "text", required: true,
      dependsOn: { field: "personalInfo.countryApplyingFor", valueIsNot: "INDIA" }
     },
    { label: "District Applying for", name: "personalInfo.district", type: "text", required: true },
    { label: "College Applying For", name: "studentInfo.collegeApplyingFor", type: "text", required: true },  
    { label: "Course Applying For", name: "studentInfo.courseApplyingFor", type: "select", required: true,
      options:[
        { label: "B.TECH", value: "B_TECH" },
        { label: "MBA", value: "MBA" },
        { label: "M.TECH", value: "M_TECH" },
        { label: "MBBS", value: "MBBS" },
        { label: "B.COM", value: "B_COM" },
        { label: "B.SC", value: "B_SC" },
        { label: "B.SC (NURSING)", value: "B_SC_NURSING" },
        { label: "BA", value: "BA" },
        { label: "BBA", value: "BBA" },
        { label: "BCA", value: "BCA" },
        { label: "B.ARCH", value: "B_ARCH" },
        { label: "B.ED", value: "B_ED" },
        { label: "B.PHARM", value: "B_PHARM" },
        { label: "B.SC (AGRICULTURE)", value: "B_SC_AGRICULTURE" },
        { label: "BAMS", value: "BAMS" },
        { label: "LLB", value: "LLB" },
        { label: "LLM", value: "LLM" },
        { label: "M.PHARM", value: "M_PHARM" },
        { label: "M.SC", value: "M_SC" },
        { label: "MCA", value: "MCA" },
        { label: "BACHELOR OF PHYSIOTHERAPY", value: "BACHELOR_OF_PHYSIOTHERAPY" },
        { label: "B.DES", value: "B_DES" },
        { label: "M.PLANNING", value: "M_PLANNING" },
        { label: "B.PLANNING", value: "B_PLANNING" },
        { label: "AGRICULTURE", value: "AGRICULTURE" },
        { label: "ARTS", value: "ARTS" },
        { label: "COMMERCE", value: "COMMERCE" },
        { label: "COMPUTER APPLICATIONS", value: "COMPUTER_APPLICATIONS" },
        { label: "DESIGN", value: "DESIGN" },
        { label: "ENGINEERING", value: "ENGINEERING" },
        { label: "LAW", value: "LAW" },
        { label: "MANAGEMENT", value: "MANAGEMENT" },
        { label: "MEDICAL", value: "MEDICAL" },
        { label: "PARAMEDICAL", value: "PARAMEDICAL" },
        { label: "PHARMACY", value: "PHARMACY" },
        { label: "SCIENCE", value: "SCIENCE" },
        { label: "ARCHITECTURE", value: "ARCHITECTURE" },
        { label: "AVIATION", value: "AVIATION" },
        { label: "DENTAL", value: "DENTAL" },
        { label: "EDUCATION", value: "EDUCATION" },
        { label: "HOTEL MANAGEMENT", value: "HOTEL_MANAGEMENT" },
        { label: "MASS COMMUNICATIONS", value: "MASS_COMMUNICATIONS" },
        { label: "VETERINARY SCIENCES", value: "VETERINARY_SCIENCES" },
        { label: "ANIMATION", value: "ANIMATION" },
        { label: "OTHERS", value: "OTHERS" }
    ]    
     },
     { label: "Stream Applying For", name: "studentInfo.streamApplyingFor", type: "text", required: true },
     {
        label: "Session",
        name: "studentInfo.session",
        type: "session",
        options:[
            { value: "2023-2024", label: "2023-2024" },
            { value: "2024-2025", label: "2024-2025" },
            { value: "2025-2026", label: "2025-2026" },
            { value: "2026-2027", label: "2026-2027" },
            { value: "2027-2028", label: "2027-2028" },
            { value: "2028-2029", label: "2028-2029" },
            { value: "2029-2030", label: "2029-2030" },
            { value: "2030-2031", label: "2030-2031" }
        ],
        required: true,
      },
      {
        label: "Entrance Exam",
        name: "studentInfo.entrance",
        type: "text",
        required: true

        },
    {
      label: "Relationship Manager",
      name: "studentInfo.rm",
      type: "select",
      options: employeeData,
      required: true,
    },
   
    {
      label: "Entrance Exam pdf",
      name: "studentInfo.entranceFile",
      type: "file",
      required: true,
      folder:"EuropassClients/EntranceExamDetails"
    },
    {
      label: "Passport Size Photo",
      name: "studentInfo.passportSizePhoto",
      type: "file",
      required: true,
      folder:"EuropassClients/ClientPassport Size Photo"
      },
      {
        label: "Student Agreement",
        name: "studentInfo.studentAgreement",
        type: "file",
        required: true,
        folder:"EuropassClients/ClientStudentAgreementDetails"
      },
  ];
  const personalDetails = [
    { label: "Country", name: "personalInfo.country", type: "select", required: true, options: [{ value: "INDIA", label: "INDIA"}, {value: "OTHERS", label: "OTHERS" }] },

    { label: "State", name: "personalInfo.state", type: "select", options: stateData, required: true,
      dependsOn: { field: "personalInfo.country", value: "INDIA" }
    },
    { label: "State", name: "personalInfo.state", type: "text", required: true,
      dependsOn: { field: "personalInfo.country", valueIsNot: "INDIA" }
     },
    { label: "District", name: "personalInfo.district", type: "text", required: true },
    { label: "Complete Address", name: "personalInfo.address", type: "text", required: true },
    {
      label: "Adhaar Number",
      name: "personalInfo.adhaar",
      type: "text",
      },
      {
      label: "PAN Number",
      name: "personalInfo.pan",
      type: "text",
      },
      {
        label: "Adhaar Card",
        name: "personalInfo.adhaarFile",
        type: "file",
        folder:"EuropassClients/ClientPersonalDetails"
        },
        {
        label: "PAN Card",
        name: "personalInfo.panFile",
        type: "file",
        folder:"EuropassClients/ClientPersonalDetails"

       },
      {
      label: "Passport Number",
      name: "personalInfo.passport",
      type: "text",
      },
  ];
  const tenthDetailsDocuments = [
    { label: "10th Percentage", name: "tenthInfo.tenthPercent", type: "text", placeholder: "Percentage", required: true, folder:"EuropassClients/Client10thDetails" },
    { label: "10th Marksheet", name: "tenthInfo.tenthMarksheet", type: "file", required: true,folder:"EuropassClients/Client10thDetails" },
    { label: "10th Admit Card", name: "tenthInfo.tenthAdmitCard", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
    { label: "10th Migration", name: "tenthInfo.tenthMigration", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
    { label: "10th Passing Certificate", name: "tenthInfo.tenthPassingCertificate", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
    { label: "10th Character Certificate", name: "tenthInfo.tenthCharacterCertificate", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
    { label: "10th Transfer Certificate", name: "tenthInfo.tenthTransferCertificate", type: "file", required: true, folder:"EuropassClients/Client10thDetails"},
  ];
  const twelfthDetailsDocuments = [
    { label: "12th Percentage", name: "twelfthInfo.twelfthPercent", type: "text", placeholder: "Percentage", required: true,folder:"EuropassClients/Client12thDetails" },
    { label: "12th Marksheet", name: "twelfthInfo.twelfthMarksheet", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
    { label: "12th Admit Card", name: "twelfthInfo.twelfthAdmitCard", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
    { label: "12th Migration", name: "twelfthInfo.twelfthMigration", type: "file", required: true , folder:"EuropassClients/Client12thDetails"},
    { label: "12th Passing Certificate", name: "twelfthInfo.twelfthPassingCertificate", type: "file", required: true , folder:"EuropassClients/Client12thDetails"},
    { label: "12th Character Certificate", name: "twelfthInfo.twelfthCharacterCertificate", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
    { label: "12th Transfer Certificate", name: "twelfthInfo.twelfthTransferCertificate", type: "file", required: true , folder:"EuropassClients/Client12thDetails"},
  ];
  const ugPgDetailsDocuments = [
    { label: "Degree Applying for (UG/PG/PHD)", name: "studentInfo.degree", type: "select", required: true, options: [
      { value: "UG", label: "UG" },
      { value: "PG", label: "PG" },
      { value: "PHD", label: "PHD" },
    ], },
    { label: "UG Percentage", name: "ugpgInfo.ugPercent", type: "text", placeholder: "Percentage", required: true,
      dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
     },
    { label: "PG Percentage", name: "ugpgInfo.pgPercent", type: "text", placeholder: "Percentage", required: true,
      dependsOn: { field: "studentInfo.degree", value: "PHD" }
    },
    {
      label: "UG Duration",
      name: "ugpgInfo.ugDuration",
      type: "select",
      placeholder: "Select UG Duration",
      dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]},
      options: [
        { value: "1",  label: "1 Year" },
        { value: "2",  label: "2 Years" },
        { value: "3",  label: "3 Years" },
        { value: "4",  label: "4 Years" },
      ],
    },
    {
      label: "PG Duration",
      name: "ugpgInfo.pgDuration",
      type: "select",
      placeholder: "Select PG Duration",
      dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]},
      options: [
        { value: "1",  label: "1 Year" },
        { value: "2",  label: "2 Years" },
        { value: "3",  label: "3 Years" },
      ],
    },
    {
      label: "UG Transcript",
      name: "ugpgInfo.ugTranscript",
      type: "file",
      folder: "client",       
      dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
    },
    {
      label: "UG Provisional Degree",
      name: "ugpgInfo.ugProvisionalDegree",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",           
      dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
    },
    {
      label: "UG Complete Degree",
      name: "ugpgInfo.ugCompleteDegree",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
    },
    {
      label: "PG Transcript",
      name: "ugpgInfo.pgTranscript",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",       
      dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
    },
    {
      label: "PG Provisional Degree",
      name: "ugpgInfo.pgProvisionalDegree",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",           
      dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
    },
    {
      label: "PG Complete Degree",
      name: "ugpgInfo.pgCompleteDegree",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
    },
    {
      label: "UG Sem 1",
      name: "ugpgInfo.ugFile1",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["1" , "2", "3", "4"] }
    },
    {
      label: "UG Sem 2",
      name: "ugpgInfo.ugFile2",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["1" , "2", "3", "4"] }
    },
    {
      label: "UG Sem 3",
      name: "ugpgInfo.ugFile3",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["2", "3", "4"] }
    },
    {
      label: "UG Sem 4",
      name: "ugpgInfo.ugFile4",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["2", "3", "4"] }
    },
    {
      label: "UG Sem 5",
      name: "ugpgInfo.ugFile5",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["3", "4"] }
    },
    {
      label: "UG Sem 6",
      name: "ugpgInfo.ugFile6",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["3", "4"] }
    },
    {
      label: "UG Sem 7",
      name: "ugpgInfo.ugFile7",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["4"] }
    },
    {
      label: "UG Sem 8",
      name: "ugpgInfo.ugFile8",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.ugDuration", value: ["4"] }
    },
    {
      label: "PG Sem 1",
      name: "ugpgInfo.pgFile1",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["1" , "2", "3"] }
    },
    {
      label: "PG Sem 2",
      name: "ugpgInfo.pgFile2",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["1" , "2", "3"] }
    },
    {
      label: "PG Sem 3",
      name: "ugpgInfo.pgFile3",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["2", "3"] }
    },
    {
      label: "PG Sem 4",
      name: "ugpgInfo.pgFile4",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["2", "3"] }
    },
    {
      label: "PG Sem 5",
      name: "ugpgInfo.pgFile5",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["3"] }
    },
    {
      label: "PG Sem 6",
      name: "ugpgInfo.pgFile6",
      type: "file",
      folder: "EuropassClients/ClientUG&PGDetails",
      dependsOn: { field: "ugpgInfo.pgDuration", value: ["3"] }
    },
  ];
  const invoices=[
    {
       label: "Invoice",
       name: "invoiceInfo.invoice",
       type: "multipleAdd",
       itemType: "file",
       folder: "EuropassClients/InvoiceDetils"
     },
     {
       label: "Europass Package",
       name: "invoiceInfo.europassPackage",
       type: "package",
       options: [
         { value: "335000", label: "3.35 Lakh" },
         { value: "650000", label: "6.5 Lakh" },
       ],
     },
     {
       label: "Registration Amount",
       name: "invoiceInfo.registration",
       type: "text",
     },
     {
       label: "Total Paid Amount",
       name: "invoiceInfo.paidAmt",
       type: "text",
     },
     {
       label: "First Installment",
       name: "invoiceInfo.firstInstallment",
       type: "select",
       options: [
         { value: "PAID", label: "PAID" },
         { value: "NOT PAID", label: "NOT PAID" },
       ],
     },
     {
       label: "Second Installment",
       name: "invoiceInfo.secondInstallment",
       type: "select",
       options: [
         { value: "PAID", label: "PAID" },
         { value: "NOT PAID", label: "NOT PAID" },
       ],
     },
     {
       label: "Third Installment",
       name: "invoiceInfo.thirdInstallment",
       type: "select",
       options: [
         { value: "PAID", label: "PAID" },
         { value: "NOT PAID", label: "NOT PAID" },
       ],
     },
   ];
  const otherDocuments = [
    { label: "Other Docs", name: "otherInfo.otherDoc", type: "file", folder:"EuropassClients/ClientOtherDocumets" },
  ];
  const expDocuments = [
    { label: "Experience letter", name: "expInfo.expLetter", type: "file",folder:"EuropassClients/ClientExperianceDetails" },
  ];
                    
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/employees?status=ACTIVE");
      const res= await apiClient.get("/api/states")
      const resCity= await apiClient.get("/api/cities")
  
      // Transform data into label and value format
      const employeesData = response.data.map((employee: any) => {
        if (!employee.basicField?.email || !employee._id) {
          console.warn("Skipping employee with missing data:", employee);
          return null;
        }
        return {
          label: employee.basicField.email,
          value: employee.basicField.email,
        };
      }).filter(Boolean); // Remove null entries
  
      setEmployeeData(employeesData);
      setStateData(res?.data)   
    } catch (err) {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEmployees();
  },[]);
  // Setup react-hook-form with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(contacts), // Use the Yup schema
  });
  // API call for student details using PUT
  const handleBasicFormIdCreationSubmit = async (data: { [key: string]: any }) => {
    try {
     if (id || clientId) {
        delete data._id;
      }
      data.clientType="INDIA";
      data.studentInfo.countryApplyingFor="INDIA";
      const payload = data;
      const method = initialData ? "PUT" : "POST"; // Use PUT for edit, POST for add
      const payloadId= clientId? clientId : id;
      const url = initialData
        ? `/api/client?id=${payloadId}`
        : "/api/client";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        setClientId(result.clientId);
        alert("Student details added successfully");
        setActiveAccordion1(false);
        setActiveAccordion2(false)
        setViewFields(true)
      } else {
        alert("Failed to submit Client data");
      }
    } catch (error) {
      console.error("Error creating Client:", error);
    }
  };
    // API call for personal details using PUT
  const handleBasicPersonalFormSubmit = async (data: { [key: string]: any }) => {
    const refreshClientId = data._id
      delete data._id
      try {
        const url = id
        ? `/api/client?id=${id}`
        : `/api/client?id=${clientId}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          alert("Personal details updated successfully");
          setActiveAccordion2(false);
          setClientId(refreshClientId)

        } else {
          alert("Failed to update Personal details");
        }
      } catch (error) {
        console.error("Error updating Personal Details form:", error);
      }
  };

  const fetchClientData = async () => {    
    if (id || clientId) {
      const url = clientId
      ? `/api/client?id=${clientId}`
      : `/api/client?id=${id}`;
      const response = await apiClient.get(url);
      setInitialData(response?.data)
      reset(response.data); // Reset form with initial data
      setClientId(response?.data?._id)
      console.log(response?.data?._id);
      
      setViewFields(true)
    }
  };
  useEffect(() => { 
    fetchClientData();
  }, [id, reset, clientId]);
  useEffect(() => {
    fetchClientData();
  },[activeAccordion1,activeAccordion2, activeAccordion3, activeAccordion4,activeAccordion5,activeAccordion6,activeAccordion7, activeAccordion8])

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
    <div className="mx-5 my-5 text-lg underline">Indian Client</div>
      {/* Accordion 1: Student Details */}
      <div className="border-b mb-4">
        <button
          className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
          onClick={() => setActiveAccordion1(true)}
        >
          <span>1. Student Info</span>
          <span>{activeAccordion1  ? "▲" : "▼"}</span>
        </button>
        {activeAccordion1 && (
          <div className="p-4">
            <AddEdit
              fields={studentInfo}
              onSubmit={handleBasicFormIdCreationSubmit}
              initialData={initialData}
            />
          </div>
        )}
      </div>
      {viewFields && <div className="">
        {/* Accordion 2: PERSONAL Details */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion2(true)}
          >
            <span>2. Personal Info</span>
            <span>{activeAccordion2  ? "▲" : "▼"}</span>
          </button>
          {activeAccordion2 && (
            <div className="p-4">
              <AddEdit
                fields={personalDetails}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 3: 10TH */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion3(true)}
          >
            <span>3. 10th Details & Documents</span>
            <span>{activeAccordion3 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion3 && (
            <div className="p-4">
              <AddEdit
                fields={tenthDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 4: 12TH */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion4(true)}
          >
            <span>4. 12th Details & Documents</span>
            <span>{activeAccordion4 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion4 && (
            <div className="p-4">
              <AddEdit
                fields={twelfthDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 5: UG & PG */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion5(true)}
          >
            <span>5. UG & PG (Details & Documents)</span>
            <span>{activeAccordion5 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion5 && (
            <div className="p-4">
              <AddEdit
                fields={ugPgDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
                //@ts-ignore
                grid={"2"}
                academic={true}
              />
            </div>
          )}
        </div>
        {/* Accordion 6: INVOICES */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion6(true)}
          >
            <span>6. Invoices</span>
            <span>{activeAccordion6 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion6 && (
            <div className="p-4">
              <AddEdit
                fields={invoices}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 7: EXP LETTER */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion7(true)}
          >
            <span>7. Experience Letter</span>
            <span>{activeAccordion7 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion7 && (
            <div className="p-4">
              <AddEdit
                fields={expDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 8: OTHER */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion8(true)}
          >
            <span>8. Other Documents</span>
            <span>{activeAccordion8 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion8 && (
            <div className="p-4">
              <AddEdit
                fields={otherDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
      </div>}  
    </div>
  );
};


const ClientPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientAddPage />
    </Suspense>
  );
};

export default ClientPage;