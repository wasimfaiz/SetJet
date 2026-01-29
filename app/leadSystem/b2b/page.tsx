// components/B2BBusinessPage.tsx
"use client";
import React, { useState, useEffect, Suspense } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import Pagination from "../../components/pagination";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import SearchableSelect from "../../components/searchableSelect";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import ReminderModal from "@/app/components/reminderModal";

const columns = [
  { header: "Business Name", accessor: "basic.institutionName" },
  { header: "Contact Person", accessor: "basic.contactPersonName" },
  { header: "Industry", accessor: "basic.businessType" },
  { header: "Phone", accessor: "basic.phoneNumber" },
  { header: "RM", accessor: "remarks.relationshipManager", type: "employeeId" },
];

const businessTypeOptions = [
  { value: "College", label: "College" },
  { value: "School", label: "School" },
  { value: "Agent", label: "Agent" },
  { value: "Consultancy", label: "Consultancy" },
  { value: "Others", label: "Others" },
];
const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Under Discussion", label: "Under Discussion" },
  { value: "Terminated", label: "Terminated" },
];

const B2BBusinessPageContent = () => {
  const router = useRouter();
  const { role, permissions } = usePermissions();
  const { employeeId } = useEmployeeContext();

  const { currentPage, changePage } = usePersistentPage(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [relationshipManager, setRelationshipManager] = useState<string | null>(
    null
  );
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/business", window.location.origin);
      if (searchQuery) url.searchParams.append("q", searchQuery);
      if (relationshipManager)
        url.searchParams.append("relationshipManager", relationshipManager);
      if (businessTypeFilter)
        url.searchParams.append("businessType", businessTypeFilter);
      if (statusFilter) url.searchParams.append("status", statusFilter);
      if (role == "EMPLOYEE")
        url.searchParams.append("relationshipManager", employeeId || "");

      const res = await fetch(url.toString());
      const data = await res.json();
      setBusinesses(data);
      setTotalPages(Math.ceil(data.length / pageLimit));
    } catch {
      setError("Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch {
      console.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    if (employeeId) fetchBusinesses();
  }, [
    employeeId,
    searchQuery,
    relationshipManager,
    businessTypeFilter,
    statusFilter,
    currentPage,
    pageLimit,
  ]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openReminderModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  const handleView = (item: any) => {
    setSelectedItem(item);
    router.push(`/leadSystem/b2b/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await fetch(`/api/business?id=${selectedItem._id}`, {
          method: "DELETE",
        });
        setBusinesses((prev) => prev.filter((b) => b._id !== selectedItem._id));
        setShowModal(false);
      } catch {
        setError("Failed to delete business");
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) changePage(page);
  };

  const renderActions = (item: any) => (
    <>
      <button title="View" className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      <button
        title="Set Reminder"
        className="h-5 w-5"
        onClick={() => openReminderModal(item)}
      >
        <FontAwesomeIcon icon={faBell} />
      </button>
      {checkButtonVisibility(permissions, "business", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => {
            setSelectedItem(item);
            setShowModal(true);
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  const startIndex = (currentPage - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;
  const currentBusinesses = businesses.slice(startIndex, endIndex);

  if (loading && !searchQuery) {
    return <Loader />;
  }

  return (
    <RouteGuard requiredPermission="b2b">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="md:text-3xl text-lg text-deepblue">B2B</div>
          <div className="flex items-center w-full justify-end pr-2 md:pr-4">
            {checkButtonVisibility(permissions, "b2b", "add") && (
              <Link
                href={`/leadSystem/b2b/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Business
              </Link>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="my-4 flex flex-col md:flex-row gap-3 px-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email"
            className="border p-2 rounded-lg w-full md:w-1/3"
          />
          {role === "ADMIN" && (
            <div className="flex gap-2 items-center w-full md:w-1/3">
              <SearchableSelect
                options={employees.map((e) => ({
                  label: e.basicField?.name,
                  value: e._id,
                }))}
                //@ts-ignore
                value={relationshipManager}
                onChange={(val: any) => setRelationshipManager(val)}
                placeholder="Filter by Relationship Manager"
              />
              {relationshipManager && (
                <button
                  onClick={() => setRelationshipManager(null)}
                  className="text-red-500 hover:underline text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2 items-center w-full md:w-1/3">
            <select
              value={businessTypeFilter || ""}
              onChange={(e) => setBusinessTypeFilter(e.target.value || null)}
              className="border p-2 rounded-lg w-full"
            >
              <option value="">All Industries</option>
              {businessTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {businessTypeFilter && (
              <button
                onClick={() => setBusinessTypeFilter(null)}
                className="text-red-500 hover:underline text-sm"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center w-full md:w-1/3">
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="border p-2 rounded-lg w-full"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="text-red-500 hover:underline text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="my-8 px-2">
          <Table
            data={currentBusinesses}
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            // handleView={handleView}
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
        {/* @ts-ignore */}
        {isModalOpen && (
          <ReminderModal
            type="business"
            onClose={() => setIsModalOpen(false)}
            selectedItem={selectedItem}
          />
        )}
      </div>
    </RouteGuard>
  );
};

const B2BBusinessPage = () => (
  <Suspense fallback={<Loader />}>
    <B2BBusinessPageContent />
  </Suspense>
);

export default B2BBusinessPage;
