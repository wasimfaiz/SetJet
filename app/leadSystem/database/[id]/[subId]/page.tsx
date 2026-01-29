"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const ContactViewPage = () => {
  const params = useParams();
  const { id, subId } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const contactFields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Email",
      value: "email",
    },
    {
      label: "Mobile",
      value: "phoneNumber",
    },
    {
      label: "State",
      value: "state",
    },
    {
      label: "Called At",
      value: "calledAt",
      type: "dateArray"
    },
    {
      label: "Status Updated At",
      value: "statusUpdatedAt",
    },
    {
      label: "Status",
      value: "status",
    },
    {
      label: "Looking for",
      value: "course",
    },
    {
      label: "Remark",
      value: "remark",
      type: "dateArray"
    },
    { label: "Transfer to", value: "transferTo.name"},
    { label: "Transfer from", value: "transferFrom.name"},
    { label: "Transfer at", value: "transferAt"},

  ];

  const fetchContact = async (id: any) => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/api/database/student-database?id=${subId}`
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
    router.push(`/leadSystem/database/${id}/edit/?id=${item._id}`);
  };
  useEffect(() => {
    if (id) {
      fetchContact(id);
    }
  }, [id]);

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
