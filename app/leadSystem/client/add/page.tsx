"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { contacts } from "@/app/utils/validation.utils";
import Loader from "@/app/components/loader";
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
  const [activeAccordion9, setActiveAccordion9] = useState<boolean>(false);
  const [activeAccordion10, setActiveAccordion10] = useState<boolean>(false);
  const [activeAccordion11, setActiveAccordion11] = useState<boolean>(false);
  const [activeAccordion12, setActiveAccordion12] = useState<boolean>(false);
  const [viewFields, setViewFields] = useState<boolean>(false);

  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState(null);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [stateData, setStateData] = useState<any[]>([]);

//studentInfo
const studentInfo = [
  { label: "Name", name: "studentInfo.name", type: "text", required: true },
  { label: "Email", name: "studentInfo.email", type: "email", required: true },
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
  { label: "Country Applying For", name: "studentInfo.countryApplyingFor", type: "select", required: true,  options:[
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
  ],},
  { label: "Course Applying For", name: "studentInfo.courseApplyingFor", type: "text", required: true },
  {
    label: "Relationship Manager",
    name: "studentInfo.rm",
    type: "select",
    options: employeeData,
    required: true,
  },
  {
    label: "Passport Size Photo",
    name: "studentInfo.passportSizePhoto",
    type: "file",
    required: true,
    folder: "EuropassClients/ClientPassport Size Photo"
  },
  {
      label: "Student Agreement",
      name: "studentInfo.studentAgreement",
      type: "file",
      required: true,
      folder:"EuropassClients/Student Agreement",
  },
];
//personalInfo
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
//tenthInfo
const tenthDetailsDocuments = [
  { label: "10th Percentage", name: "tenthInfo.tenthPercent", type: "text", placeholder: "Percentage", required: true },
  { label: "10th Marksheet", name: "tenthInfo.tenthMarksheet", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
  { label: "10th Admit Card", name: "tenthInfo.tenthAdmitCard", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
  { label: "10th Migration", name: "tenthInfo.tenthMigration", type: "file", required: true,folder:"EuropassClients/Client10thDetails" },
  { label: "10th Passing Certificate", name: "tenthInfo.tenthPassingCertificate", type: "file", required: true , folder:"EuropassClients/Client10thDetails"},
  { label: "10th Character Certificate", name: "tenthInfo.tenthCharacterCertificate", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
  { label: "10th Transfer Certificate", name: "tenthInfo.tenthTransferCertificate", type: "file", required: true, folder:"EuropassClients/Client10thDetails" },
];
//twelfthInfo
const twelfthDetailsDocuments = [
  { label: "12th Percentage", name: "twelfthInfo.twelfthPercent", type: "text", placeholder: "Percentage", required: true, folder:"EuropassClients/Client12thDetails" },
  { label: "12th Marksheet", name: "twelfthInfo.twelfthMarksheet", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
  { label: "12th Admit Card", name: "twelfthInfo.twelfthAdmitCard", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
  { label: "12th Migration", name: "twelfthInfo.twelfthMigration", type: "file", required: true, folder:"EuropassClients/Client12thDetails" },
  { label: "12th Passing Certificate", name: "twelfthInfo.twelfthPassingCertificate", type: "fie", required: true, folder:"EuropassClients/Client12thDetails" },
  { label: "12th Character Certificate", name: "twelfthInfo.twelfthCharacterCertificate", type: "file", required: true ,folder:"EuropassClients/Client12thDetails"  },
  { label: "12th Transfer Certificate", name: "twelfthInfo.twelfthTransferCertificate", type: "file", required: true , folder:"EuropassClients/Client12thDetails"},
];
//ugpgInfo
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
    label: "UG Duration (years)",
    name: "ugpgInfo.ugDuration",
    type: "select",
    placeholder: "Select UG Duration",
    dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]},
    options: [
      { value: "1",  label: "1" },
      { value: "2",  label: "2" },
      { value: "3",  label: "3" },
      { value: "4",  label: "4" },
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
    folder: "EuropassCleints/ClientUG&PGDetails",       
    dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
  },
  {
    label: "UG Provisional Degree",
    name: "ugpgInfo.ugProvisionalDegree",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",           
    dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
  },
  {
    label: "UG Complete Degree",
    name: "ugpgInfo.ugCompleteDegree",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "studentInfo.degree", value: [ "PG", "PHD" ]}
  },
  {
    label: "PG Transcript",
    name: "ugpgInfo.pgTranscript",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",       
    dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
  },
  {
    label: "PG Provisional Degree",
    name: "ugpgInfo.pgProvisionalDegree",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",           
    dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
  },
  {
    label: "PG Complete Degree",
    name: "ugpgInfo.pgCompleteDegree",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "studentInfo.degree", value: [ "PHD" ]}
  },
  {
    label: "UG Sem 1",
    name: "ugpgInfo.ugFile1",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["1" , "2", "3", "4"] }
  },
  {
    label: "UG Sem 2",
    name: "ugpgInfo.ugFile2",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["1" , "2", "3", "4"] }
  },
  {
    label: "UG Sem 3",
    name: "ugpgInfo.ugFile3",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["2", "3", "4"] }
  },
  {
    label: "UG Sem 4",
    name: "ugpgInfo.ugFile4",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["2", "3", "4"] }
  },
  {
    label: "UG Sem 5",
    name: "ugpgInfo.ugFile5",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["3", "4"] }
  },
  {
    label: "UG Sem 6",
    name: "ugpgInfo.ugFile6",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["3", "4"] }
  },
  {
    label: "UG Sem 7",
    name: "ugpgInfo.ugFile7",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["4"] }
  },
  {
    label: "UG Sem 8",
    name: "ugpgInfo.ugFile8",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.ugDuration", value: ["4"] }
  },
  {
    label: "PG Sem 1",
    name: "ugpgInfo.pgFile1",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["1" , "2", "3"] }
  },
  {
    label: "PG Sem 2",
    name: "ugpgInfo.pgFile2",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["1" , "2", "3"] }
  },
  {
    label: "PG Sem 3",
    name: "ugpgInfo.pgFile3",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["2", "3"] }
  },
  {
    label: "PG Sem 4",
    name: "ugpgInfo.pgFile4",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["2", "3"] }
  },
  {
    label: "PG Sem 5",
    name: "ugpgInfo.pgFile5",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["3"] }
  },
  {
    label: "PG Sem 6",
    name: "ugpgInfo.pgFile6",
    type: "file",
    folder: "EuropassCleints/ClientUG&PGDetails",
    dependsOn: { field: "ugpgInfo.pgDuration", value: ["3"] }
  },
];
//testasInfo
const testasDetailsDocuments = [
  { label: "TestAS", name: "testasInfo.testas", type: "select",  options: [
    { value: "REQUIRED", label: "REQUIRED" },
    { value: "NOT REQUIRED", label: "NOT REQUIRED" },
  ], },
  {
    label: "TestAS Registration",
    name: "testasInfo.testasRegistration",
    type: "select",
    options: [
      { value: "UG", label: "UG" },
      { value: "PG", label: "PG" },
      { value: "PHD", label: "PHD" },
    ],
    dependsOn: { field: "testasInfo.testas", value: "REQUIRED" }
  },
  {
    label: "TestAS Admit Card",
    name: "testasInfo.testasAdmitCard",
    type: "file",
    folder: "EuropassCleints/ClientTestasDetails",
    dependsOn: { field: "testasInfo.testas", value: "REQUIRED" }
  },
  {
    label: "TestAS Certificate",
    name: "testasInfo.testasCertificate",
    type: "file",
    folder: "EuropassCleints/ClientTestasDetails",
    dependsOn: { field: "testasInfo.testas", value: "REQUIRED" }
  },
];
//apsInfo
const apsDetailsDocuments = [
  { label: "APS", name: "apsInfo.aps", type: "select", options: [
    { value: "REQUIRED", label: "REQUIRED" },
    { value: "NOT REQUIRED", label: "NOT REQUIRED" },
  ], },
  {
    label: "APS Receipt (pdf only)",
    name: "apsInfo.apsReceipt",
    type: "file",
    folder: "EuropassCleints/ClientAPSDetails",
    dependsOn: { field: "apsInfo.aps", value: "REQUIRED" }
  },
  {
    label: "APS Student Authorized letter (pdf only)",
    name: "apsInfo.apsStudentAuthLetter",
    type: "file",
    folder: "EuropassCleints/ClientAPSDetails",
    dependsOn: { field: "apsInfo.aps", value: "REQUIRED" }
  },
  {
    label: "APS Student Consent letter (pdf only)",
    name: "apsInfo.apsConsentLetter",
    type: "file",
    folder: "EuropassCleints/ClientAPSDetails",
    dependsOn: { field: "apsInfo.aps", value: "REQUIRED" }
  },
  {
    label: "APS Certificate (pdf only)",
    name: "apsInfo.apsCertificate",
    type: "file",
    folder: "EuropassCleints/ClientAPSDetails",
    dependsOn: { field: "apsInfo.aps", value: "REQUIRED" }
  },
];
//ieltsInfo
const ieltsDetailsDocuments = [
  { label: "IELTS", name: "ieltsInfo.ielts", type: "select", options: [
    { value: "REQUIRED", label: "REQUIRED" },
    { value: "NOT REQUIRED", label: "NOT REQUIRED" },
  ], },
  {
    label: "IELTS Receipt (pdf only)",
    name: "ieltsInfo.ieltsReceipt",
    type: "file",
    folder: "EuropassCleints/ClientIetlsDetails",
    dependsOn: { field: "ieltsInfo.ielts", value: "REQUIRED" }
  },
  {
    label: "IELTS Certificate (pdf only)",
    name: "ieltsInfo.ieltsCertificate",
    type: "file",
    folder: "EuropassCleints/ClientIetlsDetails",
    dependsOn: { field: "ieltsInfo.ielts", value: "REQUIRED" }
  },
];
//admissionInfo
const docFields = [
  {
    label: "Passport",
    name: "admissionInfo.passport",
    type: "file",
    required: true,
    folder:"EuropassClients/ClientApplicationDetails"
  },
  {
    label: "European CV ",
    name: "admissionInfo.europeanCV",
    type: "file",
    required: true,
    folder:"EuropassClients/ClientApplicationDetails"

  },
  {
    label: "German Language",
    name: "admissionInfo.germanLanguage",
    type: "select",
    options: [
      { value: "REQUIRED", label: "REQUIRED" },
      { value: "NOT REQUIRED", label: "NOT REQUIRED" },
      { value: "OTHERS", label: "OTHERS" },
    ],
    required: true,
  },
  { 
    label: "Application for University/College",
    name: "admissionInfo.applicationForUniversity",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Conditional Offer Letter ",
    name: "admissionInfo.conditionalOfferLetter",
    type: "file",
    required: true,
    folder:"EuropassClients/ClientApplicationDetails"

  },
  {
    label: "Offer Letter",
    name: "admissionInfo.offerLetter",
    type: "file",
    required: true,
    folder:"EuropassClients/ClientApplicationDetails"

  },
  {
    label: "Visa Appointment Date",
    name: "admissionInfo.visaAppointmentDate",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Visa Interview Preparation",
    name: "admissionInfo.visaInterviewPreparation",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Visa Interview",
    name: "admissionInfo.visaInterview",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Visa Arrives",
    name: "admissionInfo.visaArrives",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Ticket",
    name: "admissionInfo.ticket",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Accommodation",
    name: "admissionInfo.accommodation",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Pre-Departure Counselling",
    name: "admissionInfo.preDepartureCounselling",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Airport Pickup",
    name: "admissionInfo.airportPickup",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "City Registration",
    name: "admissionInfo.cityRegistration",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "German Bank Account",
    name: "admissionInfo.germanBankAccount",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Agreement Cancellation",
    name: "admissionInfo.agreementCancellation",
    type: "select",
    options: [
      { value: "PENDING", label: "PENDING" },
      { value: "DONE", label: "DONE" },
    ],
    required: true,
  },
  {
    label: "Release Form ",
    name: "admissionInfo.releaseForm",
    type: "file",
    required: true,
  },
  { label: "LOR", name: "admissionInfo.lor", type: "multipleAdd",
    itemType: "file",
    folder:"EuropassClients/ClientApplicationDetails"
     },
  { label: "LOM", name: "admissionInfo.lom", type: "multipleAdd",
    itemType: "file",
    folder: "EuropassClients/ClientApplicationDetails" },
  { label: "SOP", name: "admissionInfo.sop", type: "multipleAdd",
    itemType: "file",
    folder: "EuropassClients/ClientApplicationDetails" },
  { label: "Block Account", name: "admissionInfo.blockAccount", type: "select", 
    options: [
    { value: "NOT REQUIRED", label: "NOT REQUIRED" },
    { value: "OPEN", label: "OPEN" },
    { value: "PENDING", label: "PENDING" },
  ], },

];
//invoiceInfo
const invoices=[
 {
    label: "Invoice",
    name: "invoiceInfo.invoice",
    type: "multipleAdd",
    itemType: "file",
    folder: "EuropassClients/InvoicesDetails"
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
//otherInfo
const otherDocuments = [
  { label: "Other Docs", name: "otherInfo.otherDoc", type: "file", folder:"EuropassClients/ClientOtherDocumets"},
];
//expInfo
const expDocuments = [
  { label: "Experience letter", name: "expInfo.expLetter", type: "file", folder:"EuropassClients/ClientExperianceDetails" },
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
        value: employee.basicField._id,
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
      data.clientType="ABROAD";
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
    console.log(clientId);
    
    setLoading(true); // Show loader while fetching client data
    try {
      if (id || clientId) {
        const url = clientId ? `/api/client?id=${clientId}` : `/api/client?id=${id}`;
        const response = await apiClient.get(url);
        setInitialData(response?.data);
        reset(response?.data); // Reset form with initial data
        setClientId(response?.data?._id);
        setViewFields(true); // Set flag to show fields
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      setError("Failed to load client data.");
    } finally {
      setLoading(false); // Hide loader after data is fetched
    }
  };
  useEffect(() => { 
    fetchClientData();
  }, [id, reset, clientId]);
  useEffect(() => {
    fetchClientData();
  },[activeAccordion1,activeAccordion2, activeAccordion3, activeAccordion4,activeAccordion5,activeAccordion6,activeAccordion7, activeAccordion8,activeAccordion9,activeAccordion10,activeAccordion11,activeAccordion12])
  if (loading) {
    return <Loader />; // Show loader component when loading is true
  }
  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
      <div className="mx-5 my-5 text-lg underline">Abroad Client</div>

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
                //@ts-ignore
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
        {/* Accordion 6: TESTAS */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion6(true)}
          >
            <span>6. Testas</span>
            <span>{activeAccordion6 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion6 && (
            <div className="p-4">
              <AddEdit
                fields={testasDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 7: APS */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion7(true)}
          >
            <span>7. APS</span>
            <span>{activeAccordion7 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion7 && (
            <div className="p-4">
              <AddEdit
                fields={apsDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 8: IELTS */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion8(true)}
          >
            <span>8. IELTS</span>
            <span>{activeAccordion8 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion8 && (
            <div className="p-4">
              <AddEdit
                fields={ieltsDetailsDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 9: INVOICES */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion9(true)}
          >
            <span>9. Invoices</span>
            <span>{activeAccordion9 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion9 && (
            <div className="p-4">
              <AddEdit
                fields={invoices}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 10: APPLICATION PROCESS */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion10(true)}
          >
            <span>10. Application process</span>
            <span>{activeAccordion10 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion10 && (
            <div className="p-4">
              <AddEdit
                fields={docFields}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 11: EXP LETTER */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion11(true)}
          >
            <span>11. Experience Letter</span>
            <span>{activeAccordion11 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion11 && (
            <div className="p-4">
              <AddEdit
                fields={expDocuments}
                onSubmit={handleBasicPersonalFormSubmit}
                initialData={initialData}
              />
            </div>
          )}
        </div>
        {/* Accordion 12: OTHER */}
        <div className="border-b mb-4">
          <button
            className="w-full text-left p-4 bg-gray-100 rounded-full flex items-center justify-between"
            onClick={() => setActiveAccordion12(true)}
          >
            <span>12. Other Documents</span>
            <span>{activeAccordion12 ? "▲" : "▼"}</span>
          </button>
          {activeAccordion12 && (
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