"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import Loader from "../../components/loader";
import StatusModal from "../../components/statusModal";
import { useEmployeeContext } from "../../contexts/employeeContext";
import RemarkModal from "../../components/remarkModal";
import Pagination from "../../components/pagination";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import apiClient from "../../utils/apiClient";
const columns = [
  { header: "Task Name", accessor: "name", type: "text" },
  { header: "Assigned At", accessor: "employee.assignedAt", type: "dateTime" },
  { header: "Priority", accessor: "priority", type: "priority" },
  { header: "Status", accessor: "status", type: "status" },
  { header: "Comment", accessor: "comment", type: "comment" },
];
const statuses = ["DONE", "PENDING", "PROGRESS"];
const MyTaskPageContent = () => {
  const router = useRouter();
  const { employeeId } = useEmployeeContext();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async (page = 1) => {
    if (employeeId) {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(
          `/api/tasks?employeeId=${employeeId}&status=${selectedStatus}&page=${page}&limit=${pageLimit}`
        );
        setTasks(response.data?.tasks);
        setTotalPages(response.data?.totalPages);
      } catch (err) {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(currentPage);
    }, 1000);
    return () => clearTimeout(timer);
  }, [employeeId, selectedStatus, currentPage, pageLimit]);

  const handleView = (item: any) => {
    router.push(`/leadSystem/mytask/${item._id}`);
  };
  const handleStatus = async (status: string) => {
    if (selectedItem) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);
      const payload = {
        ...selectedItem,
        status: status,
        statusUpdatedAt: createdAt,
      };
      try {
        const response = await apiClient.put(
          `/api/tasks?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchTasks(currentPage);
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
        comment: remark,
        commentUpdatedAt: remarkUpdatedAt,
      };
      try {
        const response = await apiClient.put(
          `/api/tasks?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchTasks(currentPage);
          setShowRemarkModal(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
        setLoading(false);
      }
    }
  };
  const openStatusModal = (item: any) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };
  const openRemarkModal = (item: any) => {
    setSelectedItem(item);
    setShowRemarkModal(true);
  };
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
    </>
  );
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      //@ts-ignore
      fetchTasks(page);
    }
  };
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container">
      <div className="flex items-center justify-between px-4 mt-10">
        <div className="text-3xl text-deepblue">My Tasks</div>
      </div>
      <div className="flex mx-4 my-4 gap-2 flex-wrap">
        <div className="flex flex-col mb-4 relative w-48">
          <select
            className={`border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none ${
              selectedStatus ? "pr-8 appearance-none" : "pr-4"
            }`}
            value={selectedStatus || ""}
            onChange={(e: any) => setSelectedStatus(e.target.value)}
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
              className="absolute right-4 top-3 text-gray-500 hover:text-red-500"
              onClick={() => setSelectedStatus("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="my-10 px-2">
        <Table
          data={tasks}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
          handleView={handleView}
          onStatusChangeClick={openStatusModal}
          onRemarkChangeClick={openRemarkModal}
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
            changePage(1); // Reset to first page when limit changes
          }}
          pageLimit={pageLimit}
        />
      </div>
      <RemarkModal
        show={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        onSave={handleRemark}
        initialDates={selectedItem?.remarkUpdatedAt}
        initialValues={selectedItem?.remark}
      />
      <StatusModal
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        //@ts-ignore
        onStatusChange={handleStatus}
      />
    </div>
  );
};
const MyTaskPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyTaskPageContent />
    </Suspense>
  );
};
export default MyTaskPage;
