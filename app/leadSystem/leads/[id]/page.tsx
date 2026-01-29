"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";

const ContactViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const contactFields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Mobile",
      value: "phoneNumber",
    },
    {
      label: "Email",
      value: "email",
    },
    {
      label: "Date",
      value: "date",
      type: "date",
    },
    {
      label: "Called at",
      value: "calledAt",
      type: "dateArray"
    },
    {
      label: "10th Percentage",
      value: "tenthPercent",
    },
    {
      label: "12th Percentage",
      value: "twelfthPercent",
    },
    {
      label: "UG Percentage",
      value: "ugPercent",
    },
    {
      label: "PG Percentage",
      value: "pgPercent",
    },
    {
      label: "Apply for Course",
      value: "course",
    },
    {
      label: "Apply for Country",
      value: "country",     
    },
    {
      label: "Gender",
      value: "gender",
    },
    {
      label: "Counseller name",
      value: "counsellorName",
    },
    {
      label: "Address",
      value: "address",
    },
    {
      label: "Lead Category",
      value: "leadCategory",     
    },
    {
      label: "Created at",
      value: "createdAt",
      type: "dateTime"
    },
    {
      label: "Assigned by",
      value: "by.employeeName",
    },
    {
      label: "Status",
      value: "status",
    },
    {
      label: "Status Updated At",
      value: "statusUpdatedAt",
      type: "dateTime"
    },
    {
      label: "Remark",
      value: "remark",
      type: "dateArray"
    },
    {
      label: "Assigned to",
      value: "to.name",
    },
    {
      label: "Assigned at",
      value: "to.assignedAt",
      type: "dateTime"
    },
    {
      label: "Profile picture",
      value: "profilePic",
      type: "file",
    },
  ]
  const fetchContact = async (id: any) => {
    try {
      const response = await apiClient.get(
        `/api/leads/student-leads?id=${id}`
      );
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching contact data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/leads/add?id=${item._id}`);
  };
  useEffect(() => {
    if (id) {
      fetchContact(id);
    }
  }, [id]);

  if (loading) {
    return <p>Loading contact data...</p>;
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
      {selectedItem ? (
        <View
          item={selectedItem}
          //@ts-ignore
          fields={contactFields}
          handleEdit={handleEdit}
        />
      ) : (
        <p>No contact found</p>
      )}
    </div>
  );
};

export default ContactViewPage;
