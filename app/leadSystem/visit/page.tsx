"use client";
import { useEffect, useState } from "react";
import axios from "axios"; // Import axios
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Mobile", accessor: "phoneNumber" },
  { header: "Email", accessor: "email" },
  { header: "Date", accessor: "date" },
  { header: "Slot", accessor: "time" },
  { header: "Address", accessor: "address" },
  { header: "Action", accessor: "action" },
];

const VisitPage = () => {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]); // State to hold fetched data
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [selectedItem, setSelectedItem] = useState<any>(null); // Selected visit for deletion
  const [showModal, setShowModal] = useState<boolean>(false); // Modal visibility

  const fetchVisitData = async () => {
    try {
      const response = await apiClient.get("/api/visit");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching visit data:", error);
      setError("Failed to load visit data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitData();
  }, []);

  const handleView = (item: any) => {
    router.push(`/leadSystem/visit/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/visit?id=${selectedItem._id}`); // Make DELETE request with ID
        setData(data.filter((item) => item._id !== selectedItem._id)); // Remove from state
        setShowModal(false); // Close modal
      } catch (error) {
        console.error("Error deleting visit:", error);
      }
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item); // Set the selected visit for deletion
    setShowModal(true); // Show modal
  };

  const renderActions = (item: any) => (
    <>
      {/* <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button> */}
      <button
        className="h-5 w-5 text-bloodred"
        onClick={() => openDeleteModal(item)}
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>; // Display error message
  }

  return (
    <RouteGuard requiredPermission="visit">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="text-3xl text-deepblue">Visit Enquiries</div>
          <div className="flex items-center w-full justify-end pr-4">
            <Link
              href={`/leadSystem/visit/add`}
              className="ml-4 bg-gradient-to-r from-blue-900 to-deepblue text-white px-6 py-4 rounded-xl hover:bg-parrotgreen"
            >
              + Add Visit
            </Link>
          </div>
        </div>
        <div className="my-20 px-2">
          <Table
            data={data}
            columns={columns}
            actions={renderActions}
            handleView={handleView}
          />
        </div>

        {/* Delete Modal */}
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>
  );
};

export default VisitPage;
