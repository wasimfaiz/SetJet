"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

  const studentInfo = [
    { label: "Name", value: "studentInfo.name" },
    { label: "Email", value: "studentInfo.email" },
    { label: "Contact Number", value: "studentInfo.contact" },
    { label: "Parent's Number", value: "studentInfo.parentContact" },
    {
      label: "D.O.B",
      value: "studentInfo.dob",
      type: "date",
    },
    { label: "Registration Number", value: "studentInfo.regNo" },
    { label: "Registration Date", value: "studentInfo.regDate" },
    {
      label: "Registration Office",
      value: "studentInfo.regOffice",
    },
    { label: "Gender", value: "studentInfo.gender" },
    { label: "Degree Applying for (UG/PG/PHD)", value: "studentInfo.degree" },
    { label: "Country Applying For", value: "studentInfo.countryApplyingFor" },
    { label: "State Applying For", value: "studentInfo.stateApplyingFor" },
    { label: "City Applying For", value: "studentInfo.cityApplyingFor" },
    { label: "College Applying For", value: "studentInfo.collegeApplyingFor" },  
    { label: "Course Applying For", value: "studentInfo.courseApplyingFor" },
    { label: "Stream Applying For", value: "studentInfo.streamApplyingFor" },
    {
        label: "Session",
        value: "studentInfo.session",
    },
    {
        label: "Entrance Exam",
        value: "studentInfo.entrance",
        type: "text",
        required: true
    },
    {
      label: "Relationship Manager",
      value: "studentInfo.rm",
    },
   
    {
        label: "Entrance Exam pdf",
        value: "studentInfo.entranceFile",
        type: "file",
    },
    {
      label: "Passport Size Photo (Photo size must be < 30KB)",
      value: "studentInfo.passportSizePhoto",
      type: "file",
      },
      {
        label: "Student Agreement",
        value: "studentInfo.studentAgreement",
        type: "file",
      },
    { label: "Country", value: "personalInfo.country" },
    { label: "State", value: "personalInfo.state" },
    { label: "District", value: "personalInfo.district" },
    { label: "Complete Address", value: "personalInfo.address" },
    {
      label: "Adhaar Number",
      value: "personalInfo.adhaar",
      type: "text",
      },
      {
      label: "PAN Number",
      value: "personalInfo.pan",
      type: "text",
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
    { label: "10th Percentage", value: "tenthInfo.tenthPercent", type: "text", placeholder: "Percentage", required: true },
    { label: "10th Marksheet", value: "tenthInfo.tenthMarksheet", type: "file", required: true },
    { label: "10th Admit Card", value: "tenthInfo.tenthAdmitCard", type: "file", required: true },
    { label: "10th Migration", value: "tenthInfo.tenthMigration", type: "file", required: true },
    { label: "10th Passing Certificate", value: "tenthInfo.tenthPassingCertificate", type: "file", required: true },
    { label: "10th Character Certificate", value: "tenthInfo.tenthCharacterCertificate", type: "file", required: true },
    { label: "10th Transfer Certificate", value: "tenthInfo.tenthTransferCertificate", type: "file", required: true },
    { label: "12th Percentage", value: "twelfthInfo.twelfthPercent", type: "text", placeholder: "Percentage", required: true },
    { label: "12th Marksheet", value: "twelfthInfo.twelfthMarksheet", type: "file", required: true },
    { label: "12th Admit Card", value: "twelfthInfo.twelfthAdmitCard", type: "file", required: true },
    { label: "12th Migration", value: "twelfthInfo.twelfthMigration", type: "file", required: true },
    { label: "12th Passing Certificate", value: "twelfthInfo.twelfthPassingCertificate", type: "file", required: true },
    { label: "12th Character Certificate", value: "twelfthInfo.twelfthCharacterCertificate", type: "file", required: true },
    { label: "12th Transfer Certificate", value: "twelfthInfo.twelfthTransferCertificate", type: "file", required: true },
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
    {
      label: "Invoice",
      value: "invoiceInfo.invoice",
      type: "fileArray",
    },
    {
      label: "Europass Package",
      value: "invoiceInfo.europassPackage",
      type: "package",
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
    { label: "Other Docs", value: "otherInfo.otherDoc", type: "file" },
    { label: "Experience letter", value: "expInfo.expLetter", type: "file" },
  ];
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

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
    router.push(`/leadSystem/client/india/add?id=${item._id}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer"
        onClick={() => {
          router.back();
        }}
      >
        Back
      </button>
      <div className="flex items-center gap-5 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r rounded-lg py-2 px-2">
        <img
          src={selectedItem?.studentInfo?.passportSizePhoto || "/profilepic.png"}
          alt="Profile Picture"
          className="md:w-32 md:h-32 w-12 h-12 rounded-full mb-4"
        />
        <div className="text-white">
          <h2 className="md:text-2xl font-semibold md:mb-2">
            {selectedItem?.studentInfo?.name}
          </h2>
          <p className="md:text-lg text-[12px]">
            Balance Amount = ₹
            {selectedItem?.invoiceInfo?.europassPackage === "Others"
              ? selectedItem?.invoiceInfo?.customise -
                selectedItem?.invoiceInfo?.paidAmt
              : selectedItem?.invoiceInfo?.europassPackage -
                selectedItem?.invoiceInfo?.paidAmt}
          </p>
          <p className="text-[10px] text-gray-400">
            Balance Amount= Package Selected - Amount Paid
          </p>
        </div>
      </div>
      {selectedItem && (
      <div className="my-4">
        <View
          item={selectedItem}
          //@ts-ignore
          fields={studentInfo}
          handleEdit={checkEditPermission("client")}
        />
      </div>
      )}
    </div>
  );
};

export default ClientViewPage;

