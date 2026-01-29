"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";

const CheckoutViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const checkoutFields = [
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
      label: "Action taken",
      value: "string",
    },
    {
      label: "Called at",
      value: "calledAt",
      type: "dateArray",
    },
    { label: "Looking for", value: "course", type: "text" },
    { label: "Remark", value: "remark", type: "dateArray" },
  ];

  const fetchCheckout = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/checkout?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCheckout(id);
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
        //@ts-ignore
        <View item={selectedItem} fields={checkoutFields} />
      ) : (
        <p>No checkout found</p>
      )}
    </div>
  );
};

export default CheckoutViewPage;
