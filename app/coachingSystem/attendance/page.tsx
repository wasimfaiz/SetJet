"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Table from "@/app/components/table";
import apiClient from "@/app/utils/apiClient";
import { faPlus, faTrashCan, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DeleteModal from "@/app/components/deletemodel";
import { usePermissions } from "@/app/contexts/permissionContext";
import Loader from "@/app/components/loader";
import RouteGuard from "@/app/components/routegaurd";

const columns = [
  { header: "Date", accessor: "date", type: "date" },
  { header: "Batch", accessor: "batchName" },
  { header: "Faculty", accessor: "faculty.name" },
];

export default function AttendanceIndex() {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [batchNames, setBatchNames] = useState<{ label: string; value: string }[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("All");

  // Fetch batch tabs
  useEffect(() => {
    apiClient
      .get("/api/batch")
      .then((r) => {
        const unique = new Map<string, string>();
        r.data.forEach((b: any) => {
          if (!unique.has(b.name)) unique.set(b.name, b._id);
        });
        const tabs = [{ label: "All", value: "All" }];
        unique.forEach((id, name) => tabs.push({ label: name, value: id }));
        setBatchNames(tabs);
      })
      .catch(console.error);
  }, []);

  // Fetch attendance for current tab
  const fetchRecords = (batchId: string) => {
    setLoading(true);
    const url = batchId === "All"
      ? "/api/attendance"
      : `/api/attendance?batchId=${batchId}`;
    apiClient
      .get(url)
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false));
  };

  // Initial load & re-fetch on tab change
  useEffect(() => {
    fetchRecords(selectedBatch);
  }, [selectedBatch]);

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await apiClient.delete(`/api/attendance?id=${selectedItem._id}`);
      // re-fetch
      fetchRecords(selectedBatch);
    } catch (e) {
      console.error(e);
    } finally {
      setShowModal(false);
    }
  };

  const handleView = (item: any) => {
    router.push(`/coachingSystem/attendance/${item._id}`);
  };

  const renderActions = (row: any) => (
    <button
      className="h-5 w-5 text-red-600"
      onClick={() => openDeleteModal(row)}
    >
      <FontAwesomeIcon icon={faTrashCan} />
    </button>
  );
  if(loading) return <Loader/>

  return (
  <RouteGuard requiredPermission="attendance">
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        <button
          className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded"
          onClick={() => router.push("/coachingSystem/attendance/add")}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-5 w-5" />
          New Sheet
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 md:gap-5 md:my-10 mt-5 px-4">
        {batchNames.map((batch) => (
          <div
            key={batch.value}
            onClick={() => setSelectedBatch(batch.value)}
            className={`cursor-pointer px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-md transition-colors duration-200 text-xs md:text-sm ${
              selectedBatch === batch.value
                ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-green-800 text-sm" />
              </div>
              <span className="font-semibold">{batch.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Table / Loader */}
        <Table
          data={records}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
          handleView={handleView}
        />

      {/* Delete Modal */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
    </div>
  </RouteGuard>
  );
}
