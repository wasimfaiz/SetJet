"use client";
import { useEffect, useState } from "react";
import axios from "axios"; // Import Axios
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";
const columns = [
  { header: "Name", accessor: "name" },
  { header: "Off", accessor: "off" },
  { header: "Validity from", accessor: "startDate", type: "date" },
  { header: "Validity till", accessor: "endDate", type: "date" },
];

const OfferPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  // Fetch the offer data from the API
  const fetchOffers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/api/offers");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setError("Failed to load offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleView = (item: any) => {
    router.push(`/leadSystem/offer/${item._id}`);
  };
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/offers?id=${selectedItem._id}`); // Make DELETE request with ID
        setData(data.filter((item) => item._id !== selectedItem._id)); // Remove from state
        setShowModal(false); // Close modal
      } catch (error) {
        console.error("Error deleting offers:", error);
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
      {checkButtonVisibility(permissions, "offer", "delete") && (
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
    return <Loader />; // Show loading while data is being fetched
  }

  return (
    <RouteGuard requiredPermission="offer">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="text-3xl text-deepblue">Offers</div>
          <div className="flex items-center w-full justify-end pr-4">
            {checkButtonVisibility(permissions, "offer", "add") && (
              <Link
                href={`/leadSystem/offer/add`}
                className="ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-6 py-4 rounded-xl"
              >
                + Add Offer
              </Link>
            )}
          </div>
        </div>
        <div className="my-20 px-2">
          <Table
            data={data}
            //@ts-ignore
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

export default OfferPage;
