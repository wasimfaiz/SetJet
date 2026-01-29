"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPhone,
  faTrashCan,
  faDownload,
  faDatabase,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import CallModal from "@/app/components/callModal";
import DbStatusModal from "@/app/components/dbStatusModal";
import CourseModal from "@/app/components/courseModal";
import RemarkModal from "@/app/components/remarkModal";
import Table from "../../components/table";
import DeleteModal from "../../components/deletemodel";
import { useEmployeeContext } from "../../contexts/employeeContext";
import Loader from "../../components/loader";
import Pagination from "../../components/pagination";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Called at", accessor: "calledAt[0]", type: "dateTime" },
  { header: "Status", accessor: "status", type: "status" },
  { header: "Transferred from", accessor: "transferFrom", type: "employeeId" },
  { header: "Looking for", accessor: "course", type: "course" },
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
  { value: "DATABASE LEADS", label: "DATABASE" },
  { value: "GROUND LEADS", label: "LEADS" },
  { value: "B2B LEADS", label: "B2B" },
];

/** 
 * Build the GET URL for fetchStudentDatabasebyEmployeeId 
 */
function getFetchUrl(activeTab: string, employeeId: string) {
  if (activeTab === "GROUND LEADS") {
    return `/api/leads/student-leads?transferId=${employeeId}`;
  }
  if (activeTab === "B2B LEADS") {
    return `/api/business/business-leads?transferId=${employeeId}`;
  }
  return `/api/database/student-database?transferId=${employeeId}&sort=descending`;
}

/** 
 * Build the base URL for modify (PUT/DELETE) operations 
 */
function getModifyUrl(activeTab: string) {
  if (activeTab === "GROUND LEADS") {
    return "/api/leads/student-leads";
  }
  if (activeTab === "B2B LEADS") {
    return "/api/business/business-leads";
  }
  return "/api/database/student-database";
}

const getNestedValue = (item: any, accessor: string, type?: string): any => {
  const regex = /([^[.\]]+)|\[(\d+)\]/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(accessor)) !== null) {
    if (match[1]) tokens.push(match[1]);
    if (match[2]) tokens.push(match[2]);
  }
  const value = tokens.reduce((acc, key) => acc && acc[key], item);
  if ((type === "date" || type === "dateTime") && typeof value === "string") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const IST = new Date(d.getTime() + 5.5 * 3600 * 1000);
    if (type === "date") {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(IST);
    }
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    let hh = d.getUTCHours();
    const min = d.getUTCMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    return `${dd}-${mm}-${yyyy}, ${hh}:${min} ${ampm}`;
  }
  return value ?? "-";
};

const TransferContentPage = () => {
  const router = useRouter();
  const { employeeId } = useEmployeeContext();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);

  const { activeTab, changeTab } = usePersistentTab("DATABASE LEADS");
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [totalStatusCount, setTotalStatusCount] = useState<Record<string, number>>({});

  // 1) Fetcher
  const fetchStudentDatabasebyEmployeeId = async (
    page = currentPage,
    status = statusFilter,
    searchTerm = searchQuery
  ) => {
    if (!employeeId) return;
    setLoading(true);
    const baseUrl = getFetchUrl(activeTab, employeeId);
    try {
      const url = `${baseUrl}&page=${page}&limit=${pageLimit}&status=${status}&searchTerm=${encodeURIComponent(
        searchTerm
      )}`;
      const res = await apiClient.get(url);
      const data = res.data;
      // data.students or data.businesses
      setContacts(data.students || data.businesses || []);
      setTotalPages(data.totalPages);
      setTotalAllCount(data.totalCount);
      setTotalStatusCount(data.totalStatusCount || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2) Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchStudentDatabasebyEmployeeId(1, statusFilter, query);
  };

  // Debounce & deps
  useEffect(() => {
    const t = setTimeout(() => {
      fetchStudentDatabasebyEmployeeId();
    }, 500);
    return () => clearTimeout(t);
  }, [employeeId, activeTab, currentPage, pageLimit, statusFilter, searchQuery]);

  // Generic modify (PUT or DELETE)
  const modifyRecord = async (
    method: "put" | "delete",
    payloadOrId?: any
  ) => {
    if (!selectedItem) return;
    const urlBase = getModifyUrl(activeTab);
    const url =
      method === "delete"
        ? `${urlBase}?id=${selectedItem._id}`
        : `${urlBase}?id=${selectedItem._id}`;
    if (method === "delete") {
      await apiClient.delete(url);
    } else {
      await apiClient.put(url, payloadOrId);
    }
    fetchStudentDatabasebyEmployeeId(currentPage, statusFilter, searchQuery);
  };

  // Action handlers
  const handleDelete = () => modifyRecord("delete");
  const handleCalling = async () => {
    const now = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();
    const updatedCalledAt = Array.isArray(selectedItem.calledAt)
      ? [now, ...selectedItem.calledAt]
      : [now];
    await modifyRecord("put", { ...selectedItem, calledAt: updatedCalledAt });
    window.open(`tel:${selectedItem.phoneNumber}`);
    setShowCallModal(false);
  };
  const handleStatus = async (status: string) => {
    const now = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();
    await modifyRecord("put", {
      ...selectedItem,
      status,
      statusUpdatedAt: now,
    });
    setShowStatusModal(false);
  };
  const handleCourse = async (course: string) => {
    await modifyRecord("put", { ...selectedItem, course });
    setShowCourseModal(false);
  };
  const handleRemark = async (remark: string[], remarkUpdatedAt?: string[]) => {
    await modifyRecord("put", { ...selectedItem, remark, remarkUpdatedAt });
    setShowRemarkModal(false);
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
  const handleView = (item: any) => {
    if (activeTab === "GROUND LEADS")
      router.push(`/leadSystem/leads/${item._id}`);
    else if (activeTab === "B2B LEADS")
      router.push(`/leadSystem/b2b/${item._id}`);
    else
      router.push(`/leadSystem/database/${item.databaseId}/${item._id}`);
  };

  const renderActions = (item: any) => (
    <>
      <button
        title="Call"
        className="h-5 w-5"
        onClick={() => openCallModal(item)}
      >
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button
        title="View"
        className="h-5 w-5"
        onClick={() => handleView(item)}
      >
        <FontAwesomeIcon icon={faEye} />
      </button>
      <button
        title="Delete"
        className="h-5 w-5 text-red-600"
        onClick={() => openDeleteModal(item)}
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </>
  );

  const handlePageChange = (page: number) => {
    changePage(page);
    fetchStudentDatabasebyEmployeeId(page, statusFilter, searchQuery);
  };

  if (loading && !searchQuery) return <Loader />;

  return (
    <div className="container mx-auto px-4">
      <h1 className="mt-8 mb-4 text-3xl font-bold text-deepblue">
        Transferred Leads
      </h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-2 rounded w-full md:w-1/3"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        {options.map((opt) => (
          <div
            key={opt.value}
            onClick={() => {
              changeTab(opt.value);
              changePage(1);
            }}
            className={`cursor-pointer px-3 py-2 rounded-lg shadow-md transition-colors duration-200 ${
              activeTab === opt.value
                ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FontAwesomeIcon icon={faDatabase} className="mr-2" />
            {opt.label}
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2 overflow-x-auto mb-6">
        {statusOptions.map((stat) => {
          // Determine the Tailwind classes for each status
          let statusColor = "bg-gray-300 text-gray-700";
          switch (stat) {
            case "ALL":
              statusColor = "bg-yellow-500 text-sm text-white";
              break;
            case "CONVERTED":
              statusColor =
                "rounded-lg bg-parrotgreen text-deepblue text-sm font-medium hover:bg-green-100 hover:text-white";
              break;
            case "PAYMENT MODE":
              statusColor =
                "rounded-lg bg-green-800 text-green-900 text-sm font-medium hover:bg-green-400 hover:text-white";
              break;
            case "INTERESTED":
              statusColor =
                "rounded-lg bg-green-500 text-green-900 text-sm font-medium hover:bg-green-900 hover:text-white";
              break;
            case "NOT INTERESTED":
              statusColor =
                "rounded-lg bg-red-500 text-red-900 text-sm font-medium hover:bg-red-900 hover:text-white";
              break;
            case "DNP":
              statusColor =
                "rounded-lg bg-orange-600 text-orange-900 text-sm font-medium hover:bg-orange-700 hover:text-white";
              break;
            case "FOLLOW UP":
              statusColor =
                "rounded-lg bg-red-400 text-deepblue text-sm font-medium hover:bg-red-500 hover:text-white";
              break;
            case "SWITCH OFF":
              statusColor =
                "rounded-lg bg-blue-400 text-deepblue text-sm font-medium hover:bg-blue-600 hover:text-white";
              break;
            case "CALL DISCONNECTED":
              statusColor =
                "rounded-lg bg-purple-400 text-purple-700 text-sm font-medium hover:bg-purple-600 hover:text-white";
              break;
            case "OTHERS":
              statusColor =
                "rounded-lg bg-teal-500 text-teal-800 text-sm font-medium hover:bg-teal-700 hover:text-white";
              break;
            case "TOTAL CALLS":
              statusColor =
                "rounded-lg bg-green-900 text-white text-sm font-medium hover:bg-green-800 hover:text-white";
              break;
          }

          const count =
            stat === "ALL" ? totalAllCount : totalStatusCount[stat] || 0;

          return (
            <button
              key={stat}
              onClick={() => {
                setStatusFilter(stat);
                changePage(1);
              }}
              className={`px-2 py-1 rounded-lg ${statusColor} ${
                statusFilter === stat ? "border-2 border-deepblue" : ""
              }`}
            >
              {stat} ({count})
            </button>
          );
        })}
      </div>
      {/* Table & Pagination */}
      <Table
        data={contacts}
        //@ts-ignore
        columns={columns}
        actions={renderActions}
        onStatusChangeClick={openStatusModal}
        onCourseChangeClick={openCourseModal}
        onRemarkChangeClick={openRemarkModal}
        db={currentPage - 1}
        pagination="manual"
        itemsPerPage={pageLimit}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageLimitChange={(l) => {
          setPageLimit(l);
          changePage(1);
        }}
        pageLimit={pageLimit}
      />

      {/* Modals */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
      <DbStatusModal
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onStatusChange={handleStatus}
      />
      <CourseModal
        show={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onCourseChange={handleCourse}
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

const TransferPage = () => {
  return (
    <Suspense fallback={<Loader />}>
      <TransferContentPage />
    </Suspense>
  );
};
export default TransferPage;
