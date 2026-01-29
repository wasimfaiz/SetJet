"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
const ContactViewPage = () => {
  const params = useParams();
  const { id, subId } = params;
  const { employeeId } = useEmployeeContext();
  
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [permission, setPermission] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      label: "Status",
      value: "status",
    },
    {
      label: "Looking for",
      value: "course",
    },
    {
      label: "Called at",
      value: "calledAt",
      type: "dateArray"
    },
    {
      label: "Remark",
      value: "remark",
      type: "dateArray"
    },
  ];
  useEffect(() => {
    if (id && employeeId) {
      fetchDatabase();
    }
  }, [id, employeeId]);

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/database?id=${id}`);
      const empData = response?.data?.employee;

      if (Array.isArray(empData)) {
        // employee is an array; find the one matching employeeId
        const match = empData.find(
          (emp: any) =>
            emp.id === employeeId || emp._id === employeeId
        );
        setPermission(match?.permissions || []);
      } else if (empData) {
        // employee is a single object
        setPermission(empData.permissions);
      } else {
        setPermission([]);
      }
    } catch (err) {
      setError("Failed to load student database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchContact = async (id: any) => {
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
    router.push(`/leadSystem/mydatabaseleads/mydatabase/${id}/edit/?id=${item._id}`);
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
          handleEdit={permission?.includes("edit") ? handleEdit : undefined}
        />
      ) : (
        <p>No contact found</p>
      )}
    </div>
  );
};

export default ContactViewPage;