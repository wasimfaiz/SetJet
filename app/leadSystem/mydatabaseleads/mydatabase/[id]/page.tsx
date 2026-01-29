"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft, faEye, faPhone, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import CallModal from "@/app/components/callModal";
import DbStatusModal from "@/app/components/dbStatusModal";
import CourseModal from "@/app/components/courseModal";
import RemarkModal from "@/app/components/remarkModal";
import TransferModal from "@/app/components/transferModal";
import Loader from "@/app/components/loader";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import Table from "@/app/components/table";
import DeleteModal from "@/app/components/deletemodel";
import Pagination from "@/app/components/pagination";
import { usePersistentPage } from "@/app/hooks/usePersistentPage";
import apiClient from "@/app/utils/apiClient";
const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  // { header: "Email", accessor: "email", type: "text" },
  {
    header: "Called at",
    accessor: "calledAt[0]",
    type: "dateTime",
  },
  { header: "Status", accessor: "status", type: "status" },
  { header: "Looking for", accessor: "course", type: "course" },
  { header: "Transfer to", accessor: "transferTo", type: "employeeId" },
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
  "TOTAL CALLS"
];
const DatabaseContentPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { employeeId, employeeName } = useEmployeeContext();

  const [contacts, setContacts] = useState<any[]>([]);
  const [database, setDatabase] = useState<any>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [permission, setPermission] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [totalStatus, setTotalStatus] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const [totalCalls, setTotalCalls] = useState(1);
  const [totalAllCount, setTotalAllCount] = useState(1);
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudentDatabasebyDatabaseId = async (page = currentPage, status="ALL", searchTerm="") => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/database/student-database?databaseId=${id}&page=${page}&limit=${pageLimit}&status=${status}&searchTerm=${searchTerm}`
      );
        if(status === "ALL")
        {
          setTotalStatus(response?.data?.totalStatusCount)
          setTotalAllCount(response?.data?.totalCount)
          setTotalCount(response?.data?.totalCount)
        }
        setContacts(response?.data?.students);
        setFilteredContacts(response?.data?.students);
        setTotalPages(response?.data?.totalPages);
    } catch (err) {
      setError("Failed to load student database.");
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
   fetchStudentDatabasebyDatabaseId(currentPage, statusFilter,query)
  };
  const fetchDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/database?id=${id}`);
      setDatabase(response?.data);
      setPermission(response?.data?.employee?.permissions)
      console.log("database", response?.data?.employee?.permissions);
    } catch (err) {
      setError("Failed to load student database.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) {
      fetchDatabase();
    }
  }, [id]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentDatabasebyDatabaseId();
    }, 500);
    return () => clearTimeout(timer);
  }, [pageLimit, currentPage]);
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(
          `/api/database/student-database?id=${selectedItem._id}`
        );
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting student data:", error);
        setError("Failed to delete student data.");
      } finally {
        await fetchStudentDatabasebyDatabaseId(currentPage, statusFilter);
      }
    }
  };
  const handleCalling = async () => {
    if (selectedItem) {
      const now = new Date();
      const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const updatedCalledAt = Array.isArray(selectedItem.calledAt)
        ? [istDate.toISOString(),...selectedItem.calledAt]
        : [istDate.toISOString()];
      const payload = {
        ...selectedItem,
        calledAt: updatedCalledAt,
      };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        const phoneNumber = selectedItem.phoneNumber;
        console.log("Dialing:", phoneNumber);
        window.open(`tel:${phoneNumber}`);
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter); 
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
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
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter);
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleTransfer = async (transferTo: any) => {
    if (selectedItem && employeeId) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
      const transferAt = new Date(now.getTime() + istOffset);
      const payload = {
        transferTo: transferTo.id,
        transferFrom: employeeId,
        transferAt,
      };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter); // Fetch data for previous page
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating transfer:", error);
      }
    }
  };
  const handleCourse = async (course: string) => {
    if (selectedItem) {
      const payload = { ...selectedItem, course: course };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter);
          setShowCourseModal(false);
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
        remarkUpdatedAt: remarkUpdatedAt
      };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter); // Fetch data for previous page
          setShowRemarkModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    changePage(1)
   fetchStudentDatabasebyDatabaseId(1, status)
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const openStatusModal = (item: any) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };
  const openCourseModal = (item: any) => {
    setSelectedItem(item);
    setShowCourseModal(true);
  };
  const openRemarkModal = (item: any) => {
    setSelectedItem(item);
    setShowRemarkModal(true);
  };
  const openCallModal = (item: any) => {
    setSelectedItem(item);
    setShowCallModal(true);
  };
  const openTransferModal = (item: any) => {
    setSelectedItem(item);
    setShowTransferModal(true);
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/mydatabaseleads/mydatabase/${id}/${item._id}`);
  };
  const renderActions = (item: any) => (
    <>
      <button title="Transfer" className="h-5 w-5" onClick={() => openTransferModal(item)}>
        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
      </button>
      <button title="Call" className="h-5 w-5" onClick={() => openCallModal(item)}>
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button title="View" className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      {permission?.includes("delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon title="Delete" icon={faTrashCan} />
        </button>
      )}
    </>
  );
  if (loading && !searchQuery) {
    return <Loader />;
  }
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      //@ts-ignore
      fetchStudentDatabasebyDatabaseId(page, statusFilter, searchQuery);
    }
  }; 
  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer mx-2"
        onClick={() => router.back()}
      >
        Back
      </button>
      <div className="flex items-center justify-between mx-2 mt-5">
        <div className="lg:text-3xl text-deepblue w-full">{database?.name}</div>
      </div>
      <div className="my-4 flex gap-1 mx-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)} 
          placeholder="Search by name"
          className="border px-2 py-1 w-full md:w-1/6 rounded-md text-xs md:text-sm"
          />
      </div>
      {/* Status Filter */}
      <div className="flex space-x-2 overflow-x-auto p-1 mt-2 mx-2">
        {statusOptions.map((status) => {
          // Determine the color for each status
          let statusColor = "bg-gray-300"; // Default color
          if (status === "ALL") statusColor = "text-sm bg-yellow-500";
          if (status === "CONVERTED")
            statusColor =
              "rounded-lg bg-parrotgreen text-deepblue text-sm font-medium hover:bg-green-100 hover:text-white";
          if (status === "PAYMENT MODE")
            statusColor =
              "rounded-lg bg-green-800 text-green-900 text-sm font-medium hover:bg-green-400 hover:text-white";
          if (status === "INTERESTED")
            statusColor =
              "rounded-lg bg-green-500 text-green-900 text-sm font-medium hover:bg-green-900 hover:text-white";
          if (status === "NOT INTERESTED")
            statusColor =
              "rounded-lg bg-red-500 text-red-900 text-sm font-medium hover:bg-red-900 hover:text-white";
          if (status === "DNP")
            statusColor =
              "rounded-lg bg-orange-600 text-orange-900 text-sm font-medium hover:bg-orange-700 hover:text-white";
          if (status === "FOLLOW UP")
            statusColor =
              "rounded-lg bg-red-400 text-deepblue text-sm font-medium hover:bg-red-500 hover:text-white";
          if (status === "SWITCH OFF")
            statusColor =
              "rounded-lg bg-blue-400 text-deepblue text-sm font-medium hover:bg-blue-600 hover:text-white";
          if (status === "CALL DISCONNECTED")
            statusColor =
              "rounded-lg bg-purple-400 text-purple-700 text-sm font-medium hover:bg-purple-600 hover:text-white";
          if (status === "OTHERS")
            statusColor =
              "rounded-lg bg-teal-500 text-teal-800 text-sm font-medium hover:bg-teal-700 hover:text-white";
          if (status === "TOTAL CALLS")
            statusColor =
              "rounded-lg bg-green-900 text-white text-sm font-medium hover:bg-green-800 hover:text-white";
              //@ts-ignore
              const statusCount = totalStatus?.[status] || 0; // Default to 0 if no count found
              let countToShow = 0;
              // Determine which count to display based on the status
              if (status === "ALL") {
                countToShow = totalAllCount;
              } else {
                countToShow = statusCount;
              }
              return (
                <button
                  key={status}
                  className={`px-1 py-1 rounded-lg text-white ${statusColor} ${
                    statusFilter === status ? "ring-2 ring-offset-1 ring-deepblue" : ""
                  }`}
                  onClick={() => handleStatusFilter(status)}
                >
                  {status} ({countToShow})
                </button>
          );
        })}
      </div>
      <div className="my-10 mx-2">
        <Table
          data={filteredContacts}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
          onStatusChangeClick={openStatusModal}
          onCourseChangeClick={openCourseModal}
          onRemarkChangeClick={openRemarkModal}
          onEmployeeSelect={openTransferModal}
          // handleView={handleView}
          //@ts-ignore
          db={currentPage - 1}
          pagination="manual"
          itemsPerPage={pageLimit}
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
      {/* Delete Modal */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
      <CourseModal
        show={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        //@ts-ignore
        onCourseChange={handleCourse}
      />
      <DbStatusModal
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        //@ts-ignore
        onStatusChange={handleStatus}
      />
      <TransferModal
        show={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferClient={handleTransfer}
      />
      <RemarkModal
        show={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        onSave={handleRemark}
        initialDates={selectedItem?.remarkUpdatedAt}
        initialValues={selectedItem?.remark}
      />
      <CallModal
        show={showCallModal}
        onClose={() => setShowCallModal(false)}
        onCall={handleCalling}
        contact={selectedItem}
      />
    </div>
  );
};
const DatabasePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DatabaseContentPage />
    </Suspense>
  );
};
export default DatabasePage;