"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import Table from "../../components/table";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import DeleteModal from "../../components/deletemodel";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";

const FormatPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [formats, setFormats] = useState<any[]>([]);
  const [filteredFormats, setFilteredFormats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(""); // Search term state

  const columns = [
    { header: "Name", accessor: "name", type: "text" },
    { header: "Drive Link", accessor: "link", type: "link" },
    { header: "Pdf", accessor: "pdf", type: "file" },
  ];

  const fetchFormats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/format");
      if (!Array.isArray(response.data)) {
        throw new Error("Response data is not an array");
      }
      const sortedFormats = response.data.sort((a: any, b: any) =>
        String(b.name || "").localeCompare(String(a.name || ""))
      );
      setFormats(sortedFormats);
      setFilteredFormats(sortedFormats); // Set filtered formats initially
    } catch (err) {
      console.error("Error fetching formats:", err);
      setError("Failed to load formats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormats();
  }, []);

  // Update filtered formats based on search term
  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = formats.filter((format) =>
      String(format.name || "")?.toLowerCase()?.includes(lowercasedTerm)
    );
    setFilteredFormats(filtered);
  }, [searchTerm, formats]);

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    router.push(`/leadSystem/format/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/format?id=${selectedItem._id}`);
        setFormats(formats.filter((item) => item._id !== selectedItem._id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting format:", error);
      }
    }
  };

  const renderActions = (item: any) => (
    <>
      {checkButtonVisibility(permissions, "format", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <RouteGuard requiredPermission="format">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mt-10">
          <h1 className="text-3xl font-bold text-deepblue">Formats</h1>
          <div className="flex items-center w-full justify-end pr-2 md:pr-4">
            {checkButtonVisibility(permissions, "format", "add") && (
              <Link
                href={`/leadSystem/format/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Format
              </Link>
            )}
          </div>
        </div>
        {/* Search Bar */}
        <div className="mt-5 mb-8">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/2 focus:ring focus:ring-deepblue focus:outline-none"
          />
        </div>
        <div className="my-10 px-2">
          <Table
            data={filteredFormats} // Use filtered formats
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            handleView={handleView}
          />
          <DeleteModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </RouteGuard>
  );
};

export default FormatPage;
