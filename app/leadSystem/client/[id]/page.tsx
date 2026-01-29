"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import View from "@/app/components/view";
const ClientViewPage = () => {
  const params = useParams();
  const { id } = params;
  const { permissions } = usePermissions();

  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

//studentInfo
const studentInfo = [
  { label: "Name", value: "studentInfo.name", type: "text",  },
  { label: "Email", value: "studentInfo.email", type: "email",  },
  { label: "Contact Number", value: "studentInfo.contact", type: "text",  },
  { label: "Parent's Number", value: "studentInfo.parentContact", type: "text",  },
  {
    label: "D.O.B",
    value: "studentInfo.dob",
    type: "date",
  },
  { label: "Registration Number", value: "studentInfo.regNo", type: "text",  },
  { label: "Registration Date", value: "studentInfo.regDate", type: "date",  },
  {
    label: "Registration Office",
    value: "studentInfo.regOffice",
    type: "select",
    options: [
      { value: "BIHAR", label: "BIHAR" },
      { value: "DEHRADUN", label: "DEHRADUN" },
    ],
    
  },
  { label: "Gender", value: "studentInfo.gender", type: "select",  options: [
      { value: "MALE", label: "Male" },
      { value: "FEMALE", label: "Female" }
    ]
  },
  { label: "Degree Applying for (UG/PG/PHD)", value: "studentInfo.degree", type: "select",  options: [
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
  ], },
  { label: "Country Applying For", value: "studentInfo.countryApplyingFor", type: "text"},
  { label: "Course Applying For", value: "studentInfo.courseApplyingFor", type: "text"},
  {
    label: "Relationship Manager",
    value: "studentInfo.rm",
    type: "select",
  },
  {
    label: "Passport Size Photo (Photo size must be < 30KB",
    value: "studentInfo.passportSizePhoto",
    type: "file",
    
    },
    {
      label: "Student Agreement",
      value: "studentInfo.studentAgreement",
      type: "file",
      
    },
//personalInfo
  { label: "Country", value: "personalInfo.country" },
  { label: "State", value: "personalInfo.state" },
  { label: "District", value: "personalInfo.district" },
  { label: "Complete Address", value: "personalInfo.address" },
  {
    label: "Adhaar Number",
    value: "personalInfo.adhaar",
  },
  {
    label: "PAN Number",
    value: "personalInfo.pan",
  },
  {
    label: "Adhaar Card",
    value: "personalInfo.adhaarFile",
    type: "file",
  },
  {
    label: "PAN Card",
    value: "personalInfo.panFile",
    type: "file",
  },
  {
    label: "Passport Number",
    value: "personalInfo.passport",
    type: "text",
  },
//tenthInfo
  { label: "10th Percentage", value: "tenthInfo.tenthPercent" },
  { label: "10th Marksheet", value: "tenthInfo.tenthMarksheet", type: "file" },
  { label: "10th Admit Card", value: "tenthInfo.tenthAdmitCard", type: "file" },
  { label: "10th Migration", value: "tenthInfo.tenthMigration", type: "file" },
  { label: "10th Passing Certificate", value: "tenthInfo.tenthPassingCertificate", type: "file" },
  { label: "10th Character Certificate", value: "tenthInfo.tenthCharacterCertificate", type: "file" },
  { label: "10th Transfer Certificate", value: "tenthInfo.tenthTransferCertificate", type: "file" },
//twelfthInfo
  { label: "12th Percentage", value: "twelfthInfo.twelfthPercent", type: "text"},
  { label: "12th Marksheet", value: "twelfthInfo.twelfthMarksheet", type: "file"},
  { label: "12th Admit Card", value: "twelfthInfo.twelfthAdmitCard", type: "file",  },
  { label: "12th Migration", value: "twelfthInfo.twelfthMigration", type: "file",  },
  { label: "12th Passing Certificate", value: "twelfthInfo.twelfthPassingCertificate", type: "file",  },
  { label: "12th Character Certificate", value: "twelfthInfo.twelfthCharacterCertificate", type: "file",  },
  { label: "12th Transfer Certificate", value: "twelfthInfo.twelfthTransferCertificate", type: "file",  },
//ugpgInfo
  { label: "UG Percentage", value: "ugpgInfo.ugPercent", type: "text" },
  { label: "UG Duration", value: "ugpgInfo.ugDuration", type: "text" },
  { label: "UG Complete Degree", value: "ugpgInfo.ug_completeDegree", type: "file" },
  { label: "UG Transcript", value: "ugpgInfo.ug_transcript", type: "file" },
  { label: "UG Provisional Degree", value: "ugpgInfo.ug_provisionalDegree", type: "file" },
  { label: "PG Percentage", value: "ugpgInfo.pgPercent", type: "text", placeholder: "Percentage" },
  { label: "PG Duration", value: "ugpgInfo.pgDuration", type: "text" },
  { label: "PG Complete Degree", value: "ugpgInfo.pg_completeDegree", type: "file" },
  { label: "PG Transcript", value: "ugpgInfo.pg_transcript", type: "file" },
  { label: "PG Provisional Degree", value: "ugpgInfo.pg_provisionalDegree", type: "file" },
  { label: "UG Sem 1", value: "ugpgInfo.ugFile1", type: "file" },
  { label: "UG Sem 2", value: "ugpgInfo.ugFile2", type: "file" },
  { label: "UG Sem 3", value: "ugpgInfo.ugFile3", type: "file" },
  { label: "UG Sem 4", value: "ugpgInfo.ugFile4", type: "file" },
  { label: "UG Sem 5", value: "ugpgInfo.ugFile5", type: "file" },
  { label: "UG Sem 6", value: "ugpgInfo.ugFile6", type: "file" },
  { label: "UG Sem 7", value: "ugpgInfo.ugFile7", type: "file" },
  { label: "UG Sem 8", value: "ugpgInfo.ugFile8", type: "file" },
  { label: "PG Sem 1", value: "ugpgInfo.pgFile1", type: "file" },
  { label: "PG Sem 2", value: "ugpgInfo.pgFile2", type: "file" },
  { label: "PG Sem 3", value: "ugpgInfo.pgFile3", type: "file" },
  { label: "PG Sem 4", value: "ugpgInfo.pgFile4", type: "file" },
  { label: "PG Sem 5", value: "ugpgInfo.pgFile5", type: "file" },
  { label: "PG Sem 6", value: "ugpgInfo.pgFile6", type: "file" },
//testasInfo
  { label: "TestAS", value: "testasInfo.testas", type: "testas" },
//apsInfo
  { label: "APS", value: "apsInfo.aps", type: "aps"},
//ieltsInfo
  { label: "IELTS", value: "ieltsInfo.ielts", type: "ielts"},
//admissionInfo
  {
    label: "Passport",
    value: "admissionInfo.passport",
    type: "file",
    
  },
  {
    label: "European CV ",
    value: "admissionInfo.europeanCV",
    type: "file",
    
  },
  {
    label: "German Language",
    value: "admissionInfo.germanLanguage",
  },
  { 
    label: "Application for University/College",
    value: "admissionInfo.applicationForUniversity", 
  },
  {
    label: "Conditional Offer Letter ",
    value: "admissionInfo.conditionalOfferLetter",
    type: "file",
  },
  {
    label: "Offer Letter",
    value: "admissionInfo.offerLetter",
    type: "file", 
  },
  {
    label: "Visa Appointment Date",
    value: "admissionInfo.visaAppointmentDate",
  },
  {
    label: "Visa Interview Preparation",
    value: "admissionInfo.visaInterviewPreparation",
  },
  {
    label: "Visa Interview",
    value: "admissionInfo.visaInterview",
  },
  {
    label: "Visa Arrives",
    value: "admissionInfo.visaArrives", 
  },
  {
    label: "Ticket",
    value: "admissionInfo.ticket",
  },
  {
    label: "Accommodation",
    value: "admissionInfo.accommodation", 
  },
  {
    label: "Pre-Departure Counselling",
    value: "admissionInfo.preDepartureCounselling",
  },
  {
    label: "Airport Pickup",
    value: "admissionInfo.airportPickup",
  },
  {
    label: "City Registration",
    value: "admissionInfo.cityRegistration",
  },
  {
    label: "German Bank Account",
    value: "admissionInfo.germanBankAccount",
  },
  {
    label: "Agreement Cancellation",
    value: "admissionInfo.agreementCancellation", 
  },
  {
    label: "Release Form ",
    value: "admissionInfo.releaseForm",
    type: "file",  
  },
  { label: "LOR", value: "admissionInfo.lor", type: "fileArray"  },
  { label: "LOM", value: "admissionInfo.lom", type: "fileArray"  },
  { label: "SOP", value: "admissionInfo.sop", type: "fileArray",  },
  { label: "Block Account", value: "admissionInfo.blockAccount" },
//invoiceInfo
 {
    label: "Invoice",
    value: "invoiceInfo.invoice",
    type: "fileArray",
  },
  {
    label: "Europass Package",
    value: "invoiceInfo.europassPackage",
  },
  {
    label: "Registration Amount",
    value: "invoiceInfo.registration",
    type: "text",
  },
  {
    label: "Total Paid Amount",
    value: "invoiceInfo.paidAmt",
    type: "text",
  },
  {
    label: "First Installment",
    value: "invoiceInfo.firstInstallment",
  },
  {
    label: "Second Installment",
    value: "invoiceInfo.secondInstallment",
  },
  {
    label: "Third Installment",
    value: "invoiceInfo.thirdInstallment",
  },
//otherInfo
  { label: "Other Docs", value: "otherInfo.otherDoc", type: "file" },
//expInfo
  { label: "Experience letter", value: "expInfo.expLetter", type: "file" },
];



const checkEditPermission = (key: string) =>
    checkButtonVisibility(permissions, key, "edit") ? handleEdit : undefined;

const fetchContact = async (id: any) => {
  setLoading(true);
    try {
      const response = await apiClient.get(`/api/client?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
};

useEffect(() => {
    if (id) {
      fetchContact(id);
    }
}, [id]);

const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/client/add?id=${item._id}`);
};

if (loading) {
    return <Loader />;
}

  return (
    <div className="container my-10">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer"
        onClick={() => {
          router.back();
        }}
      >
        Back
      </button>
      <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen rounded-lg p-6 shadow-lg transition-all duration-300">
        <img
          src={selectedItem?.studentInfo?.passportSizePhoto || "/profilepic.png"}
          alt="Profile Picture"
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg mb-4 md:mb-0"
        />
        <div className="text-white text-center md:text-left">
          <h2 className="text-xl md:text-xl font-extrabold mb-2 text-shadow-md">
            {selectedItem?.studentInfo?.name || "Name not available"}
          </h2>
          <p className="text-sm md:text-base font-medium mb-1">
            <span className="font-semibold">Country Applying For: </span> 
            {selectedItem?.studentInfo?.countryApplyingFor || "Not specified"}
          </p>
          <p className="text-sm md:text-base font-medium mb-1">
            <span className="font-semibold">Course Applying For: </span> 
            {selectedItem?.studentInfo?.courseApplyingFor || "Not specified"}
          </p>
          <div className="mt-4">
            <p className="text-lg md:text-xl font-semibold text-yellow-300">
              Balance Amount: ₹
              {selectedItem?.invoiceInfo?.europassPackage === "Others"
                ? selectedItem?.invoiceInfo?.customise -
                  selectedItem?.invoiceInfo?.paidAmt
                : selectedItem?.invoiceInfo?.europassPackage -
                  selectedItem?.invoiceInfo?.paidAmt || "0"}
            </p>
            <p className="text-xs text-gray-300 italic mt-2">
              (Balance = Package Selected - Amount Paid)
            </p>
          </div>
        </div>
      </div>
      <div className="my-4">
        <View
          item={selectedItem}
          //@ts-ignore
          fields={studentInfo}
          handleEdit={checkEditPermission("client")}
        />
      </div>
    </div>
  );
};

export default ClientViewPage;

