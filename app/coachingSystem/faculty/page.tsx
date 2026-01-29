"use client";
import React, { useState, useEffect, Suspense } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faHome } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import Pagination from "../../components/pagination";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "basicField.name" },
  { header: "Role", accessor: "basicField.jobRole" },
  { header: "Status", accessor: "basicField.status" },
  { header: "Mobile", accessor: "basicField.phoneNumber" },
  { header: "Email", accessor: "basicField.email" },
  { header: "Gender", accessor: "basicField.gender" },
];

const options = [
  { value: "BIHAR", label: "BIHAR" },
  { value: "DEHRADUN", label: "DEHRADUN" },
];
const statuses = ["ACTIVE", "INACTIVE"];
const FacultyPageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  // Use our custom hook to persist tab state and page state
  const { activeTab, changeTab } = usePersistentTab("BIHAR");
  const { currentPage, changePage } = usePersistentPage(1);

  const [facultys, setFacultys] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchFacultys = async (search = "", page = currentPage) => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/api/facultys?searchTerm=${search}&page=${page}&limit=${pageLimit}&location=${activeTab}&status=${selectedStatus}`
      );

      let updatedFacultys = response.data?.facultys || [];

      setFacultys(updatedFacultys);
      setTotalPages(response.data?.totalPages);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacultys(searchQuery, currentPage);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab, pageLimit, currentPage, selectedStatus]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchFacultys(query, currentPage);
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    router.push(`/coachingSystem/faculty/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/facultys?id=${selectedItem._id}`);
        setFacultys(facultys.filter((emp) => emp._id !== selectedItem._id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting faculty:", error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchFacultys(searchQuery, page);
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderActions = (item: any) => (
    <>
      {checkButtonVisibility(permissions, "faculty", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading && !searchQuery) {
    return <Loader />;
  }

  return (
    <RouteGuard requiredPermission="faculty">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="md:text-3xl text-lg text-deepblue">Facultys</div>
          <div className="flex items-center w-full justify-end pr-2 md:pr-4">
            {checkButtonVisibility(permissions, "faculty", "add") && (
              <Link
                href={`/coachingSystem/faculty/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Faculty
              </Link>
            )}
          </div>
        </div>
        {/* Search */}
        <div className="my-2 flex gap-1 mx-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email"
            className="border p-1 w-full lg:w-1/3 w-2/3 rounded-lg"
          />
        </div>
        {/* Tabs */}
        <div className="flex space-x-4 mt-5 px-4 md:gap-4">
          {options.map((location) => (
            <div
              key={location.value}
              onClick={() => {
                changeTab(location.value);
                changePage(1);
              }}
              className={`cursor-pointer px-2 py-1 md:px-3 md:pr-6 md:py-3 rounded-lg shadow-md transition-colors duration-200 ${
                activeTab === location.value
                  ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white hover:bg-gradient-to-r hover:from-green-700 hover:to-parrotgreen"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
                  <FontAwesomeIcon icon={faHome} className="text-green-800" />
                </div>
                <div className="lg:text-sm text-[10px] font-semibold text-center">
                  {location.value}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mx-5 my-2">
          <div className="flex flex-col relative w-40">
            <select
              className={`border border-gray-300 rounded-lg px-2 py-1 mt-1 focus:ring focus:ring-deepblue focus:outline-none ${
                selectedStatus ? "pr-8" : "pr-4"
              } text-xs md:text-sm`}
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="" label="Status" />
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {selectedStatus && (
              <button
                className="absolute right-6 top-2 text-gray-500 hover:text-red-500 text-xs"
                onClick={() => setSelectedStatus("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="my-8 px-2">
          <Table
            data={facultys}
            columns={columns}
            actions={renderActions}
            handleView={handleView}
            pagination="manual"
            itemsPerPage={pageLimit}
            db={currentPage - 1}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageLimitChange={(limit) => {
              setPageLimit(limit);
              changePage(1);
            }}
            pageLimit={pageLimit}
          />
        </div>
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>
  );
};

const FacultyPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FacultyPageContent />
    </Suspense>
  );
};

export default FacultyPage;
