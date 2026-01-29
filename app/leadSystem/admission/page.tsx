"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faEye,
  faPhone,
  faTrashCan,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import CallModal from "../../components/callModal";
import RemarkModal from "../../components/remarkModal";
import CourseModal from "../../components/courseModal";
import DbStatusModal from "../../components/dbStatusModal";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Pagination from "../../components/pagination";
import Loader from "../../components/loader";
import { useEmployeeContext } from "../../contexts/employeeContext";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "College", accessor: "collegeName", type: "text" },
  { header: "Looking for", accessor: "courseName", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  // { header: "Email", accessor: "email", type: "text" },
  {
    header: "Called at",
    accessor: "calledAt[0]",
    type: "dateTime",
  },
  { header: "Status", accessor: "status", type: "status" },
  {
    header: "Status Updated By",
    accessor: "statusUpdatedBy.employeeName",
    type: "text",
  },
  { header: "Remark", accessor: "remark", type: "remark" },
];
const statusOptions = [
  "ALL",
  "CONVERTED",
  "PAYMENT MODE",
  "INTERESTED",
  "NOT INTERESTED",
  "DNP",
  "FOLLOW UP",
  "SWITCH OFF",
  "CALL DISCONNECTED",
  "OTHERS",
  "TOTAL CALLS",
];
const options = [
  { value: "USER", label: "USERS" },
  { value: "ADMISSION", label: "ADMISSION ENQUIRIES" },
];
const AdmissionPageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { employeeId, employeeName } = useEmployeeContext();

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [totalAllCount, setTotalAllCount] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalStatus, setTotalStatus] = useState<any>([]);
  const [pageLimit, setPageLimit] = useState(10);

  const fetchAdmissions = async (status = statusFilter, page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/admission?status=${status}&page=${page}&limit=${pageLimit}`
      );
      setAdmissions(response?.data?.admissions);
      setTotalPages(response?.data?.totalPages || 1);
      setTotalStatus(response?.data?.statusCounts || []);
      setTotalAllCount(response?.data?.totalStatusCount || 0);
    } catch (err) {
      setError("Failed to load admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmissions(statusFilter, currentPage);
    }, 500);
    return () => clearTimeout(timer);
  }, [statusFilter, currentPage, pageLimit]);

  const handleView = (item: any) => {
    router.push(`/leadSystem/admission/${item._id}`);
  };
  const handleStatus = async (status: string) => {
    if (selectedItem) {
      const payload = {
        ...selectedItem,
        status: status,
        statusUpdatedBy: { employeeName: employeeName, employeeId: employeeId },
      };
      delete payload._id;
      const url = "admission";
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchAdmissions(statusFilter);
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleCalling = async () => {
    if (selectedItem) {
      const now = new Date();
      const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const updatedCalledAt = Array.isArray(selectedItem.calledAt)
        ? [istDate.toISOString(), ...selectedItem.calledAt]
        : [istDate.toISOString()];
      const payload = {
        ...selectedItem,
        calledAt: updatedCalledAt,
      };
      delete payload._id;
      const url = "admission";
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        const phoneNumber = selectedItem.phoneNumber;
        console.log("Dialing:", phoneNumber);
        window.open(`tel:${phoneNumber}`);
        if (response.status === 200) {
          fetchAdmissions(statusFilter);
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleRemark = async (remark: string[], remarkUpdatedAt?: string[]) => {
    if (selectedItem) {
      const payload = {
        ...selectedItem,
        remark: remark,
        remarkUpdatedAt: remarkUpdatedAt,
      };
      delete payload._id;
      const url = "admission";
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchAdmissions(statusFilter);
          setShowRemarkModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  // NEW: Move an admission to clients as clientType = ABROAD using server-side migration route,
  // then remove admission (server route handles create+delete transactionally where possible)
  const handleMoveToClients = async (item: any) => {
    if (!item) return;
    setLoading(true);
    setError(null);

    try {
      // call server migration route which maps admission -> client and deletes admission
      const res = await apiClient.post(`/api/migrateAdmission?id=${item._id}`, {
        actor: {
          employeeId,
          employeeName,
        },
      });

      if (res.status === 201 || res.status === 200) {
        // successful migration — remove from local list and refresh counts
        setAdmissions((prev) => prev.filter((a) => a._id !== item._id));
        await fetchAdmissions(statusFilter, currentPage);
      } else {
        // backend returned non-success
        console.error(
          "Migration API returned non-OK status:",
          res.status,
          res.data
        );
        setError("Failed to move to clients. Please try again.");
      }
    } catch (err: any) {
      console.error(
        "Error moving admission to clients:",
        err?.response?.data || err.message || err
      );
      setError(
        err?.response?.data?.error ||
          "Failed to move to clients. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    changePage(1);
    setStatusFilter(status);
    fetchAdmissions(status);
  };
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/admission?id=${selectedItem._id}`);
        setAdmissions((prevAdmissions) =>
          prevAdmissions.filter(
            (admission) => admission._id !== selectedItem._id
          )
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting admission:", error);
        setError("Failed to delete admission.");
      } finally {
        await fetchAdmissions();
      }
    }
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchAdmissions(statusFilter, page);
    }
  };
  const handleNavigation = (tab: string) => {
    // changePage(1)
    if (tab === "USER") {
      router.push("/leadSystem/userAdmission");
    }
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const openRemarkModal = (item: any) => {
    setSelectedItem(item);
    setShowRemarkModal(true);
  };
  const openStatusModal = (item: any) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };
  const openCallModal = (item: any) => {
    setSelectedItem(item);
    setShowCallModal(true);
  };
  const renderActions = (item: any) => (
    <>
      <button
        className="h-5 w-5"
        onClick={() => openCallModal(item)}
        title="Call"
      >
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button
        className="h-5 w-5 ml-2"
        onClick={() => handleView(item)}
        title="View"
      >
        <FontAwesomeIcon icon={faEye} />
      </button>

      {/* Move to clients */}
      <button
        className="h-5 w-5 ml-2 text-deepblue"
        onClick={(e) => {
          e.stopPropagation();
          // confirm before moving
          // simple confirm; replace with a better modal if desired
          if (confirm(`Move ${item.name} to clients as ABROAD?`)) {
            handleMoveToClients(item);
          }
        }}
        title="Move to CLIENTS"
      >
        <FontAwesomeIcon icon={faDatabase} />
      </button>

      {checkButtonVisibility(permissions, "userAdmission", "delete") && (
        <button
          className="h-5 w-5 text-bloodred ml-2"
          onClick={(e) => {
            e.stopPropagation();
            openDeleteModal(item);
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <RouteGuard requiredPermission="userAdmission">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <h1 className="md:text-3xl text-lg text-deepblue">
            Users & Admission Enquiries
          </h1>
        </div>
        <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2">
          {options.map((location) => (
            <div
              key={location.value}
              onClick={() => handleNavigation(location.value)}
              className={`cursor-pointer px-1 py-1 md:px-2 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
                location.value === "ADMISSION"
                  ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white hover:bg-gradient-to-r hover:from-green-700 hover:to-parrotgreen"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <div className="flex items-center justify-start gap-1">
                <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-green-800 h-4 w-4"
                  />
                </div>
                <div className="lg:text-xs text-[8px] font-semibold text-center">
                  {location.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Status Filter */}
        <div className="flex space-x-2 overflow-x-auto px-2 md:py-5">
          {statusOptions.map((status) => {
            let statusColor = "bg-gray-300";
            if (status === "ALL") statusColor = "bg-yellow-500";
            if (status === "CONVERTED")
              statusColor = "bg-parrotgreen text-deepblue";
            if (status === "PAYMENT MODE")
              statusColor = "bg-green-800 text-green-900";
            if (status === "INTERESTED")
              statusColor = "bg-green-500 text-green-900";
            if (status === "NOT INTERESTED")
              statusColor = "bg-red-500 text-red-900";
            if (status === "DNP") statusColor = "bg-orange-600 text-orange-900";
            if (status === "FOLLOW UP")
              statusColor = "bg-red-400 text-deepblue";
            if (status === "SWITCH OFF")
              statusColor = "bg-blue-400 text-deepblue";
            if (status === "CALL DISCONNECTED")
              statusColor = "bg-purple-400 text-purple-700";
            if (status === "OTHERS") statusColor = "bg-teal-500 text-teal-800";
            if (status === "TOTAL CALLS")
              statusColor = "bg-green-900 text-white";
            //@ts-ignore
            const filteredItem = totalStatus?.find(
              (item: any) => item.status === status
            );
            const countToShow =
              status === "ALL" ? totalAllCount : filteredItem?.count || 0;

            return (
              <button
                key={status}
                className={`px-2 py-1 text-xs rounded-lg ${statusColor} ${
                  statusFilter === status
                    ? "ring-2 ring-offset-1 ring-deepblue"
                    : ""
                }`}
                onClick={() => handleStatusFilter(status)}
              >
                {status} ({countToShow})
              </button>
            );
          })}
        </div>
        <div className="md:my-10 px-2">
          <Table
            data={admissions}
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            handleView={handleView}
            onStatusChangeClick={openStatusModal}
            onRemarkChangeClick={openRemarkModal}
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

        {/* Delete Modal */}
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
        <CallModal
          show={showCallModal}
          onClose={() => setShowCallModal(false)}
          onCall={handleCalling}
          contact={selectedItem}
        />
        <RemarkModal
          show={showRemarkModal}
          onClose={() => setShowRemarkModal(false)}
          onSave={handleRemark}
          initialDates={selectedItem?.remarkUpdatedAt}
          initialValues={selectedItem?.remark}
        />
        <DbStatusModal
          show={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusChange={handleStatus}
        />
      </div>
    </RouteGuard>
  );
};

const AdmissionPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdmissionPageContent />
    </Suspense>
  );
};
export default AdmissionPage;
