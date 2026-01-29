"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Table from "../../../components/table";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPhone,
  faTrashCan,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../../components/deletemodel";
import CallModal from "@/app/components/callModal";
import DbStatusModal from "@/app/components/dbStatusModal";
import CourseModal from "@/app/components/courseModal";
import RemarkModal from "@/app/components/remarkModal";
import TransferModal from "@/app/components/transferModal";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import Loader from "@/app/components/loader";
import Pagination from "@/app/components/pagination";
import { usePersistentPage } from "@/app/hooks/usePersistentPage";
import apiClient from "@/app/utils/apiClient";
import usePersistentState from "@/app/hooks/usePersistentState";
import Modal from "@/app/components/genericModal";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "State", accessor: "state", type: "text", hideOnMobile: true },
  { header: "Assigned to", accessor: "to", type: "employeeId" },
  { header: "Assigned at", accessor: "assignedAt", type: "dateTime" },
  {
    header: "Called at",
    accessor: "calledAt[0]",
    type: "dateTime",
  },
  { header: "Status", accessor: "status", type: "status" },
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

const categories = [ "UNASSIGNED", "ASSIGNED"];

const courses = [
  { label: "BACHELORS", value: "BACHELORS" },
  { label: "MASTERS", value: "MASTERS" },
  { label: "MBA", value: "MBA" },
  { label: "MBBS", value: "MBBS" },
  { label: "MEDICAL", value: "MEDICAL" },
  { label: "SPOKEN ENGLISH", value: "SPOKEN ENGLISH" },
  { label: "IELTS COURSE", value: "IELTS COURSE" },
  { label: "TESTAS COURSE", value: "TESTAS COURSE" },
  { label: "GERMAN LANGUAGE COURSE", value: "GERMAN LANGUAGE COURSE" },
  { label: "WORKING VISA", value: "WORKING VISA" },
  { label: "OTHERS", value: "OTHERS" },
];

const DatabasePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { employeeId, employeeName } = useEmployeeContext();

  const CHUNK_SIZE = 500;

  const [contacts, setContacts] = useState<any[]>([]);
  const [database, setDatabase] = useState<any>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [totalStatus, setTotalStatus] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const [totalAllCount, setTotalAllCount] = useState(1);
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(125);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter States
  const [assigned, setAssigned] = usePersistentState(
    "shared-filter-assign",
    "ASSIGNED"
  );
  useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = usePersistentState(
    "shared-filter-employee",
    null
  );
  const [date, setDate] = usePersistentState("shared-filter-date", "");
  const [dbEmployees, setDbEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  // “Assign to Employee” modal visibility
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);

  // Fetch student database by database ID, with filters
  const fetchStudentDatabasebyDatabaseId = async (
    page = currentPage,
    status = "ALL",
    searchTerm = "",
    assignedFilter = "",
    selectedEmployeeFilter: any = null,
    dateFilter = ""
  ) => {
    setLoading(true);
    try {
      let url = `/api/database/student-database?databaseId=${id}&page=${page}&limit=${pageLimit}&status=${status}&searchTerm=${searchTerm}`;

      if (assignedFilter) {
        url += `&assigned=${assignedFilter}`;
      }

      if (selectedEmployeeFilter) {
        url += `&assignId=${selectedEmployeeFilter}`;
      }

      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }

      const response = await apiClient.get(url);

      setTotalStatus(response?.data?.totalStatusCount);
      setTotalAllCount(response?.data?.totalCount);
      setTotalCount(response?.data?.totalCount);
      setContacts(response?.data?.students);
      setFilteredContacts(response?.data?.students);
      setTotalPages(response?.data?.totalPages);
    } catch {
      setError("Failed to load student database.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the main database object (including its employee array)
  const fetchDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/database?id=${id}`);
      const db = response?.data;
      setDatabase(db);

      // Derive dbEmployees from db.employee
      const mapped = Array.isArray(db.employee)
        ? db.employee.map((emp: any) => ({
            label: emp.name || emp.basicField?.name || emp.email,
            value: emp.id || emp._id,
          }))
        : [];
      setDbEmployees(mapped);
    } catch {
      setError("Failed to load student database.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debouncedHandleSearch = useCallback(
    (query: string) => {
      fetchStudentDatabasebyDatabaseId(
        1,
        statusFilter,
        query,
        assigned,
        selectedEmployee,
        date
      );
    },
    [statusFilter, assigned, selectedEmployee, date]
  );

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedHandleSearch(query);
  };

  // Initial data fetch when component mounts
  useEffect(() => {
    if (id) {
      fetchDatabase();
      fetchStudentDatabasebyDatabaseId(
        currentPage,
        statusFilter,
        searchQuery,
        assigned,
        selectedEmployee,
        date
      );
    }
  }, [id]);

  // Refetch when filters or pagination change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentDatabasebyDatabaseId(
        currentPage,
        statusFilter,
        searchQuery,
        assigned,
        selectedEmployee,
        date
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [pageLimit, currentPage, assigned, selectedEmployee, date, statusFilter, searchQuery]);

  // Handle delete
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(
          `/api/database/student-database?id=${selectedItem._id}`
        );
        setContacts((prev) =>
          prev.filter((c) => c._id !== selectedItem._id)
        );
        setShowDeleteModal(false);
      } catch {
        setError("Failed to delete student data.");
      } finally {
        fetchStudentDatabasebyDatabaseId(
          currentPage,
          statusFilter,
          searchQuery,
          assigned,
          selectedEmployee,
          date
        );
      }
    }
  };

  // Handle calling
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
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        const phoneNumber = selectedItem.phoneNumber;
        window.open(`tel:${phoneNumber}`);
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(
            currentPage,
            statusFilter,
            searchQuery,
            assigned,
            selectedEmployee,
            date
          );
          setShowStatusModal(false);
        }
      } catch {
        console.error("Error updating status");
      }
    }
  };

  // Handle status change
  const handleStatus = async (status: string) => {
    if (selectedItem) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
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
          fetchStudentDatabasebyDatabaseId(
            currentPage,
            statusFilter,
            searchQuery,
            assigned,
            selectedEmployee,
            date
          );
          setShowStatusModal(false);
        }
      } catch {
        console.error("Error updating status");
      }
    }
  };

  // Handle course change
  const handleCourse = async (course: string) => {
    if (selectedItem) {
      const payload = { ...selectedItem, course: course };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(
            currentPage,
            statusFilter,
            searchQuery,
            assigned,
            selectedEmployee,
            date
          );
          setShowCourseModal(false);
        }
      } catch {
        console.error("Error updating course");
      }
    }
  };

  // Handle remark update
  const handleRemark = async (remark: string[], remarkUpdatedAt?: string[]) => {
    if (selectedItem) {
      const payload = {
        ...selectedItem,
        remark: remark,
        remarkUpdatedAt: remarkUpdatedAt,
      };
      try {
        const response = await apiClient.put(
          `/api/database/student-database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentDatabasebyDatabaseId(
            currentPage,
            statusFilter,
            searchQuery,
            assigned,
            selectedEmployee,
            date
          );
          setShowRemarkModal(false);
        }
      } catch {
        console.error("Error updating remark");
      }
    }
  };

  // Handle status filter button clicks
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    changePage(1);
    fetchStudentDatabasebyDatabaseId(
      1,
      status,
      searchQuery,
      assigned,
      selectedEmployee,
      date
    );
  };

  // Modal openers
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
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
  const openAssignModal = (item: any) => {
    setSelectedItem(item);
    setShowAssignModal(true);
  };

  // Handle "View" action
  const handleView = (item: any) => {
    router.push(`/leadSystem/database/${id}/${item._id}`);
  };

  // Render action buttons in the table
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => openCallModal(item)}>
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      <button
        className="h-5 w-5 text-bloodred"
        onClick={() => openDeleteModal(item)}
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </>
  );

  // Handle file import (CSV / Excel)
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const data = results.data.map((row: any) => {
            const filledRow: any = {};
            headers.forEach((header: string) => {
              filledRow[header] = row[header] || "";
            });
            return filledRow;
          });
          importContacts(data);
        },
        error: (err) => setError(`CSV Parsing Error: ${err.message}`),
      });
    } else if (file.name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target?.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = sheetData[0];
        //@ts-ignore
        const data = sheetData.slice(1).map((row: any[]) => {
          const obj: any = {};
          //@ts-ignore
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index] !== undefined ? row[index] : "";
          });
          return obj;
        });
        importContacts(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const importContacts = async (data: any[]) => {
    setError(null);
    setIsUploading(true);
    const total = Math.ceil(data.length / CHUNK_SIZE);
    setTotalChunks(total);

    try {
      for (let i = 0; i < total; i++) {
        const chunk = data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        setUploadProgress(i + 1);

        await apiClient.post(`/api/database/student-database/shared-import?id=${id}`, chunk);
      }

      setIsUploading(false);
      fetchStudentDatabasebyDatabaseId(
      currentPage,
      statusFilter,
      searchQuery,
      assigned,
      selectedEmployee,
      date
    );    
  } catch (err: any) {
      console.error("Import error:", err);
      setError("Import failed. Please check file format and required fields.");
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownload = async () => {
    const url = "https://europassimmigration.s3.us-east-1.amazonaws.com/excelSheet/example.xlsx";
    const label = "downloaded-file";
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = label;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      console.error("Error downloading the file");
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      //@ts-ignore
      fetchStudentDatabasebyDatabaseId(
        page,
        statusFilter,
        searchQuery,
        assigned,
        selectedEmployee,
        date
      );
    }
  };

  // Handle “Assign to Employee” via modal confirmation
  const handleAssignToEmployee = async (empId: string, empName: string) => {
    if (!selectedRows.length) {
      console.warn("No selected rows to assign.");
      setShowAssignModal(false);
      return;
    }
    setLoading(true)
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const payload = {
      to: empId,
      assignedAt: istDate,
      ids: selectedRows,
    };
    try {
      const response = await apiClient.post(
        `/api/database/student-database/assign`,
        payload
      );
      if (response.status === 200) {
        fetchStudentDatabasebyDatabaseId(
          currentPage,
          statusFilter,
          searchQuery,
          assigned,
          selectedEmployee,
          date
        );
        setSelectedRows([]);
        setIsModalOpen(true)
      } else {
        console.error("Failed to assign employee:", response.statusText);
      }
    } catch {
      console.error("Error updating status");
    } finally {
      setShowAssignModal(false);
      setLoading(false)
    }
  };

  // Handle “Select All” checkbox in the table
  const handleSelectAll = (isChecked: boolean) => {
    const allIds = isChecked
      ? filteredContacts.map((item) => item._id)
      : [];
    setSelectedRows(allIds);
  };

  // Handle individual row selection
  const handleRowSelect = (isChecked: boolean, rowId: string) => {
    setSelectedRows((prev) =>
      isChecked ? [...prev, rowId] : prev.filter((id) => id !== rowId)
    );
  };

  if (loading && !searchQuery) {
    return <Loader />;
  }

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer mx-2"
        onClick={() => router.back()}
      >
        Back
      </button>

      <div className="flex items-center justify-between px-4 mt-10">
        <div className="lg:text-3xl text-deepblue w-full">
          {database?.name}
        </div>
        <div className="flex w-full justify-end pr-2 sm:pr-4 gap-2 sm:gap-3">
          {/* Import Button */}
          <label
            className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-deepblue
            hover:from-green-900 hover:to-parrotgreen text-white rounded-lg
            text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5 transition"
          >
            + Import
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Sample Sheet Download Button */}
          <button
            className="flex items-center bg-gradient-to-r from-blue-900 to-deepblue
            hover:from-green-900 hover:to-parrotgreen text-white rounded-lg
            text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5
            transition"
            onClick={handleDownload}
          >
            <FontAwesomeIcon
              icon={faDownload}
              className="text-sm sm:text-base md:text-lg pr-1"
            />
            Sample Sheet
          </button>
        </div>
      </div>
      {isUploading && (
        <div className="my-3">
          <div className="h-3 relative w-full rounded-full overflow-hidden bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${(uploadProgress / totalChunks) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading chunk {uploadProgress} of {totalChunks}
          </p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isUploading && uploadProgress === totalChunks && totalChunks > 0 && (
        <p className="text-green-600 text-sm mt-2">Import completed successfully.</p>
      )}
      {/* Status Filter */}
      <div className="flex space-x-2 overflow-x-auto p-1 mt-2 mx-2">
        {statusOptions.map((status) => {
          let statusColor = "bg-gray-300";
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
          const statusCount = totalStatus?.[status] || 0;
          let countToShow = 0;
          if (status === "ALL") countToShow = totalAllCount;
          else countToShow = statusCount;

          return (
            <button
              key={status}
              className={`px-1 py-1 rounded-lg text-white ${statusColor} ${
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
        {/* Assigned Filter */}
      <div className="w-full my-4 mx-2">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = assigned === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  const val = isActive ? "" : cat;
                  setAssigned(val);
                  changePage(1);
                }}
                className={`
                  whitespace-nowrap
                  px-4 py-2
                  text-sm font-medium
                  rounded-full
                  transition
                  ${isActive
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 border-purple-500 border-2 hover:bg-gray-200"}
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="mx-2 my-3 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-4">
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="border px-2 py-1 w-full md:w-1/6 rounded-md text-xs md:text-sm"
        />

        {/* Date Filter */}
        <div className="relative w-full md:w-1/6">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              changePage(1);
            }}
            className="px-2 py-1 border rounded-md w-full text-xs md:text-sm"
          />
          {date && (
            <button
              onClick={() => {
                setDate("");
                changePage(1);
              }}
              className="absolute right-8 top-2 text-gray-400 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Employee Filter */}
        <div className="relative w-full md:w-1/6">
          <select
            className="border rounded-md px-2 py-1 w-full text-xs md:text-sm"
            //@ts-ignore
            value={selectedEmployee || ""}
            onChange={(e) => {
              //@ts-ignore
              setSelectedEmployee(e.target.value);
              changePage(1);
            }}
          >
            <option value="">Select Employee</option>
            {dbEmployees.map((emp) => (
              <option key={emp.value} value={emp.value}>
                {emp.label}
              </option>
            ))}
          </select>
          {selectedEmployee && (
            <button
              className="absolute right-1 top-3 text-gray-500 hover:text-red-500 text-xs"
              //@ts-ignore
              onClick={() => setSelectedEmployee(null)}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Assign to Employee Button */}
      <div className="flex flex-wrap gap-2 md:gap-4 items-center mb-5 mx-2">
        <button
          disabled={selectedRows.length <= 0}
          className={`px-4 py-2 rounded-lg text-sm ${
            selectedRows.length > 0
              ? "bg-purple-500 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
          onClick={() => setShowAssignModal(true)}
        >
          Assign to Employee
        </button>
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
            //@ts-ignore
            db={currentPage - 1}
            pagination="manual"
            itemsPerPage={pageLimit}
            checkboxEnabled={true}
            //@ts-ignore
            handleSelectAll={handleSelectAll} handleRowSelect={handleRowSelect} selectedRows={selectedRows}
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
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />

      {/* Other Modals */}
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

      {/* Inline “Assign to Employee” Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg text-center mb-4">Select Employee</h2>

            <div className="max-h-64 overflow-y-auto border rounded-lg p-3">
              {dbEmployees.length > 0 ? (
                dbEmployees.map((emp) => (
                  <button
                    key={emp.value}
                    className={`w-full text-left py-2 px-4 rounded-lg font-medium ${
                      selectedItem?.value === emp.value
                        ? "bg-deepblue text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedItem(emp)}
                  >
                    {emp.label}
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500">No employees.</div>
              )}
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                className="py-2 px-4 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-deepblue text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={() => {
                  if (selectedItem) {
                    handleAssignToEmployee(selectedItem.value, selectedItem.label);
                  }
                }}
                disabled={!selectedItem}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <Modal
          title={"Success"}
          description={"Selected leads assigned to employee successfully!"}
          onClose={()=>setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const DatabasePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <DatabasePageContent />
  </Suspense>
);

export default DatabasePage;
