"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import apiClient from "@/app/utils/apiClient";

const OfferViewPage = () => {
  const params = useParams();
  const { permissions } = usePermissions();

  const { id } = params;
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const fields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Off",
      value: "off",
    },
    {
      label: "Valid from",
      value: "startDate",
    },
    {
      label: "Valid till",
      value: "endDate",
    },
  ];

  const fetchOffer = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/offers?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching offer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOffer(id);
    }
  }, [id]);

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/offer/add?id=${item._id}`);
  };

  // Show a loading message while fetching data
  if (loading) {
    return <p>Loading offer data...</p>;
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
          fields={fields}
          handleEdit={
            checkButtonVisibility(permissions, "offer", "edit")
              ? handleEdit
              : undefined
          }
        />
      ) : (
        <p>No offer found</p>
      )}
    </div>
  );
};

export default OfferViewPage;
