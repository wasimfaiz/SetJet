"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const ContactViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const contactFields = [
    { label: "Name", value: "name", type: "text" },
    { label: "Email", value: "email", type: "text" },
    { label: "Mobile", value: "phoneNumber", type: "text" },
    { label: "Action taken", value: "action", type: "text" },
    { label: "Called at", value: "calledAt", type: "dateArray" },
    { label: "Looking for", value: "course", type: "text" },
    { label: "Remark", value: "remark", type: "dateArray" },

    // New fields
    { label: "Budget", value: "budget", type: "text" },
    { label: "City", value: "city", type: "text" },
    { label: "Created At", value: "createdAt", type: "date" },
    { label: "Exam", value: "exam", type: "text" },
    { label: "Flag", value: "flag", type: "text" },
    { label: "Notes", value: "notes", type: "text" },
    { label: "Notified", value: "notified", type: "boolean" },
    { label: "Percentile", value: "percentile", type: "text" },
    { label: "Source", value: "sourceHeading", type: "text" },
    { label: "WhatsApp", value: "whatsapp", type: "text" },
  ];

  const fetchContact = async (id: any) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/contact?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching contact data:", error);
    } finally {
      setLoading(false);
    }
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
          router.push("/leadSystem/enquiry");
        }}
      >
        Back
      </button>
      {selectedItem ? (
        //@ts-ignore
        <View item={selectedItem} fields={contactFields} />
      ) : (
        <p>No contact found</p>
      )}
    </div>
  );
};

export default ContactViewPage;
