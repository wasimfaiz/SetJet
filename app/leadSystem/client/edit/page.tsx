"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddEditClient from "@/app/components/addeditClient";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";

const ClientEditPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const clientFields = [
    {
      label: "Name",
      name: "studentReg.studentName",
      type: "text",
    },
    {
      label: "Email",
      name: "studentReg.studentEmail",
      type: "email",
    },
    {
      label: "Contact Number",
      name: "studentReg.contact",
      type: "text",
    },
    {
      label: "Parent's Number",
      name: "studentReg.parentContact",
      type: "text",
    },
    {
      label: "Registration Number",
      name: "studentReg.regNo",
      type: "text",
    },
    {
      label: "Registration Date",
      name: "studentReg.regDate",
      type: "date",
    },
    {
      label: "Gender",
      name: "studentReg.gender",
      type: "select",
      options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
      ],
    },
    { label: "District", name: "studentReg.district", type: "text" },
    { label: "State", name: "studentReg.state", type: "text" },
    { label: "Country", name: "studentReg.country", type: "text" },
    {
      label: "Complete Address",
      name: "studentReg.address",
      type: "text",
    },
    {
      label: "Country Applying For",
      name: "studentReg.countryApplyingFor",
      type: "select",
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
        { value: "ITALY", label: "ITALY" },
        { value: "MAURITIUS", label: "MAURITIUS" }
      ],     
    },
    {
      label: "Course Applying For",
      name: "studentReg.courseApplyingFor",
      type: "text",
    },
    {
      label: "Stream (UG/PG)",
      name: "studentReg.stream",
      type: "select",
      options: [
        { value: "UG", label: "UG" },
        { value: "PG", label: "PG" },
      ],
    },
    {
      label: "Relationship Manager",
      name: "studentReg.rm",
      type: "select",
      options: employeeData,
      required: true,
    },
    {
      label: "Europass Package",
      name: "studentReg.europassPackage",
      type: "package",
      options: [
        { value: "335000", label: "3.35 Lakh" },
        { value: "650000", label: "6.5 Lakh" },
      ],
    },
    {
      label: "Registration Amount",
      name: "studentReg.registration",
      type: "text",
    },
    {
      label: "Total Paid Amount",
      name: "studentReg.paidAmt",
      type: "text",
    },
    {
      label: "First Installment",
      name: "studentReg.firstInstallment",
      type: "text",
    },
    {
      label: "Second Installment",
      name: "studentReg.secondInstallment",
      type: "text",
    },
    {
      label: "Third Installment",
      name: "studentReg.thirdInstallment",
      type: "text",
    },

    // {
    //   label: "Balance Amount",
    //   name: "studentReg.balanceAmount",
    //   type: "text",
    // },
    { label: "Block Account", name: "studentReg.blockAccount", type: "text" },
    {
      label: "Student Agreement",
      name: "studentReg.studentAgreement",
      type: "file",
    },

    {
      label: "Invoice",
      name: "invoice",
      type: "invoice",
    },
    {
      label: "Adhaar Number",
      name: "academicField.adhaar",
      type: "text",
    },
    {
      label: "PAN Number",
      name: "academicField.pan",
      type: "text",
    },
    {
      label: "Passport Number",
      name: "academicField.passport",
      type: "text",
    },
    {
      label: "D.O.B",
      name: "academicField.dob",
      type: "date",
      required: true,
    },
    {
      label: "10th Percentage",
      name: "academicField.tenthPercent",
      type: "text",
      placeholder: "Percentage",
      required: true,
    },
    {
      label: "12th Percentage",
      name: "academicField.twelfthPercent",
      type: "text",
      placeholder: "Percentage",
      required: true,
    },
    {
      label: "UG Percentage",
      name: "academicField.ugPercent",
      type: "text",
      placeholder: "Percentage",
      required: true,
    },
    {
      label: "PG Percentage",
      name: "academicField.pgPercent",
      type: "text",
      placeholder: "Percentage",
      required: true,
    },
    {
      label: "10th Marksheet",
      name: "academicField.tenthMarksheet",
      type: "file",
    },
    {
      label: "10th Admit Card",
      name: "academicField.tenthAdmitCard",
      type: "file",
    },
    {
      label: "10th Migration",
      name: "academicField.tenthMigration",
      type: "file",
    },
    {
      label: "10th Passing Certificate",
      name: "academicField.tenthPassingCertificate",
      type: "file",
    },
    {
      label: "10th Character Certificate",
      name: "academicField.tenthCharacterCertificate",
      type: "file",
    },
    {
      label: "10th Transfer Certificate",
      name: "academicField.tenthTransferCertificate",
      type: "file",
    },

    {
      label: "12th Marksheet",
      name: "academicField.twelfthMarksheet",
      type: "file",
    },
    {
      label: "12th Admit Card",
      name: "academicField.twelfthAdmitCard",
      type: "file",
    },
    {
      label: "12th Migration",
      name: "academicField.twelfthMigration",
      type: "file",
    },
    {
      label: "12th Passing Certificate",
      name: "academicField.twelfthPassingCertificate",
      type: "file",
    },
    {
      label: "12th Character Certificate",
      name: "academicField.twelfthCharacterCertificate",
      type: "file",
    },
    {
      label: "12th Transfer Certificate",
      name: "academicField.twelfthTransferCertificate",
      type: "file",
    },
    {
      label: "Passport Size Photo",
      name: "academicField.passportSizePhoto",
      type: "file",
    },
    {
      label: "UG all semesters marksheet PDF",
      name: "academicField.ugPdf",
      type: "file",
    },
    {
      label: "PG all semesters marksheet PDF",
      name: "academicField.pgPdf",
      type: "file",
    },
    { label: "LOM", name: "docField.lom", type: "file" },
    { label: "SOP", name: "docField.sop", type: "file" },
    {
      label: "German Language",
      name: "docField.germanLanguage",
      type: "language",
      options: [
        { value: "REQUIRED", label: "REQUIRED" },
        { value: "NOT REQUIRED", label: "NOT REQUIRED" },
      ],
      required: true,
    },
    {
      label: "TestAS",
      name: "docField.testas",
      type: "testas",
      options: [
        { value: "REQUIRED", label: "REQUIRED" },
        { value: "NOT REQUIRED", label: "NOT REQUIRED" },
      ],
    },
    // {
    //   label: "TestAS Registration",
    //   name: "docField.testasRegistration",
    //   type: "select",
    //   options: [
    //     { value: "PENDING", label: "PENDING" },
    //     { value: "NOT REQUIRED", label: "NOT REQUIRED" },
    //     { value: "DONE", label: "DONE" },
    //   ],
    // },
    // {
    //   label: "TestAS Admit Card",
    //   name: "docField.testasAdmitCard",
    //   type: "select",
    //   options: [
    //     { value: "NOT REQUIRED", label: "NOT REQUIRED" },
    //     { value: "SENT", label: "SENT" },
    //     { value: "NOT YET", label: "NOT YET" },
    //   ],
    // },
    // {
    //   label: "TestAS Certificate",
    //   name: "docField.testasCertificate",
    //   type: "select",
    //   options: [
    //     { value: "WAITING", label: "WAITING" },
    //     { value: "RECEIVED", label: "RECEIVED" },
    //     { value: "NOT REQUIRED", label: "NOT REQUIRED" },
    //   ],
    // },
    {
      label: "APS",
      name: "docField.aps",
      type: "aps",
      options: [
        { value: "REQUIRED", label: "REQUIRED" },
        { value: "NOT REQUIRED", label: "NOT REQUIRED" },
      ],
    },
    {
      label: "Conditional Offer Letter",
      name: "docField.conditionalOfferLetter",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Offer Letter",
      name: "docField.offerLetter",
      type: "file",
    },
    {
      label: "Visa Appointment Date",
      name: "docField.visaAppointmentDate",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Visa Interview Preparation",
      name: "docField.visaInterviewPreparation",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Visa Interview",
      name: "docField.visaInterview",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Visa Arrives",
      name: "docField.visaArrives",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Accommodation Ticket",
      name: "docField.accommodationTicket",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Pre-Departure Counselling",
      name: "docField.preDepartureCounselling",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Airport Pickup",
      name: "docField.airportPickup",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "City Registration",
      name: "docField.cityRegistration",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "German Bank Account",
      name: "docField.germanBankAccount",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    {
      label: "Agreement Cancellation",
      name: "docField.agreementCancellation",
      type: "select",
      options: [
        { value: "PENDING", label: "PENDING" },
        { value: "DONE", label: "DONE" },
      ],
    },
    { label: "Release Form", name: "docField.releaseForm", type: "text" },
    {
      label: "Other Docs",
      name: "docField.otherDoc",
      type: "file",
    },
  ];

  useEffect(() => {
    const fetchClientData = async () => {
      if (id) {
        setLoading(true); // Start loading when fetching client data
        try {
          const response = await apiClient.get(`/api/client?id=${id}`);
          setInitialData(response.data);
        } catch (error) {
          setError("Failed to fetch client data.");
        } finally {
          setLoading(false); // Stop loading when done
        }
      }
    };
    fetchClientData();
  }, []);
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/employees");

      // Transform data into label and value format
      const transformedData = response.data.map((item: any) => ({
        value: item?.basicField.email,
        label: item?.basicField.email,
      }));

      setEmployeeData(transformedData);
      console.log(transformedData);
    } catch (err) {
      setError("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }
      setLoading(true); // Show loader on form submit
      const payload = data;
      const method = "PUT";
      const url = `/api/client?id=${id}`;
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
        router.push("/leadSystem/client");
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false); // Hide loader after form submission
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

      <AddEditClient
        fields={clientFields}
        initialData={initialData}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
const ClientEditPage = () => {
  return (
    <Suspense fallback={<div>Loading....</div>}>
      <ClientEditPageContent />
    </Suspense>
  );
};
export default ClientEditPage;
