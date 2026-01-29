"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const FormatViewPage = () => {
  const params = useParams();
  const { id } = params;
  const { permissions } = usePermissions();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const formatFields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Drive Link",
      value: "link",
      type: "link",
    },
    {
      label: "Pdf format",
      value: "pdf",
      type: "file",
    },
  ];

  const fetchFormat = async (id: any) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/format?id=${id}`);
      setSelectedItem(response.data);
    } catch (error) {
      console.error("Error fetching formatdata:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/format/add?id=${item._id}`);
  };
  useEffect(() => {
    if (id) {
      fetchFormat(id);
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
          fields={formatFields}
          handleEdit={
            checkButtonVisibility(permissions, "format", "edit")
              ? handleEdit
              : undefined
          }
        />
      ) : (
        <p>No formatfound</p>
      )}
    </div>
  );
};

export default FormatViewPage;
