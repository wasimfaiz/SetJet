"use client";
import { Suspense, useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Table from "../../../components/table";
import { useParams, useRouter } from "next/navigation";
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
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import Loader from "@/app/components/loader";
import { usePermissions } from "@/app/contexts/permissionContext";
import Pagination from "@/app/components/pagination";
import { usePersistentPage } from "@/app/hooks/usePersistentPage";
import apiClient from "@/app/utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  // { header: "Email", accessor: "email", type: "text" },
  { header: "State", accessor: "state", type: "text", hideOnMobile: true },
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
  "TOTAL CALLS"
];
const DatabasePageContent = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { role } = useEmployeeContext();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [database, setDatabase] = useState<any>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [totalStatus, setTotalStatus] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const [totalAllCount, setTotalAllCount] = useState(1);
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudentDatabasebyDatabaseId = async (page = currentPage, status="ALL", searchTerm="") => {
    // setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/database/student-database?databaseId=${id}&page=${page}&limit=${pageLimit}&status=${status}&searchTerm=${searchTerm}`
      );
        setTotalStatus(response?.data?.totalStatusCount)
        setTotalAllCount(response?.data?.totalCount)
        setTotalCount(response?.data?.totalCount)
      setContacts(response?.data?.students);
      setFilteredContacts(response?.data?.students);
      setTotalPages(response?.data?.totalPages);
    } catch (err) {
      setError("Failed to load student database.");
    } finally {
      // setLoading(false);
    }
  }; 
  const handleSearch = (query: string) => {
    setSearchQuery(query);
   fetchStudentDatabasebyDatabaseId(1, statusFilter,query)
  };
  const fetchDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/database?id=${id}`);
      setDatabase(response?.data);
      console.log("database", response?.data);
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
  // useEffect(() => {
  //   fetchStudentDatabasebyDatabaseId(1,"TOTAL CALLS");
  // }, []);
  // useEffect(() => {
  //   fetchStudentDatabasebyDatabaseId(1,"TOTAL CALLS", searchQuery);
  // }, [searchQuery]);
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
      // Ensure calledAt is an array and add the new timestamp (as a string)
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
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter); // Fetch data for previous page
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
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
          fetchStudentDatabasebyDatabaseId(currentPage, statusFilter); // Fetch data for previous page
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
   fetchStudentDatabasebyDatabaseId(1, status, searchQuery)
  };
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/database/student-database/export?id=${id}&status=${statusFilter}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to export Excel");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-database-${id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Excel export failed:", error);
    }
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
    router.push(`/leadSystem/database/${id}/${item._id}`);
  };
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Check if the file is a CSV or Excel file
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        complete: (results: any) => {
          const importedData = results.data.map((row: any) => {
            // Get the headers from the CSV file (from the first row)
            const headers = results.meta.fields;
            const rowWithEmptyValues: any = {};

            // For each header, ensure the value is set, even if missing
            headers.forEach((header: string) => {
              rowWithEmptyValues[header] = row[header] || ""; // Replace missing data with ""
            });

            return rowWithEmptyValues;
          });

          importContacts(importedData);
        },
        error: (error: any) => {
          console.error("Error parsing CSV file:", error);
        },
      });
    } else if (file.name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Assuming you want to parse the first sheet
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Load as array of arrays

        // Get headers (first row of the Excel sheet)
        const headers:any = sheetData[0];
        //@ts-ignore
        const processedData = sheetData.slice(1).map((row: any[]) => {
          const rowWithEmptyValues: any = {};

          headers.forEach((header:any, index:any) => {
            // Map the value from the row to the header, if the value is missing, set it to ""
            rowWithEmptyValues[header] = row[index] !== undefined ? row[index] : "";
          });

          return rowWithEmptyValues;
        });

        importContacts(processedData);
      };
      reader.readAsBinaryString(file);
    }
  }
  };
  const importContacts = async (data: any[]) => {
    const updatedData = data.map(contact => ({
      ...contact,
      to: database?.employee?.id || null,
      assignedAt: database?.employee?.assignedAt
    }));

    const BATCH_SIZE = 1000; // adjust batch size as needed
    for (let i = 0; i < updatedData.length; i += BATCH_SIZE) {
      const chunk = updatedData.slice(i, i + BATCH_SIZE);
      try {
        await apiClient.post(
          `/api/database/student-database/import?id=${id}`,
          chunk
        );
      } catch (err) {
        console.error(`Error importing chunk ${i / BATCH_SIZE + 1}:`, err);
        throw err;
      }
    }

    fetchStudentDatabasebyDatabaseId(currentPage);
  };

  const handleDownload = async () => {
    const url = "https://europassimmigration.s3.us-east-1.amazonaws.com/excelSheet/example.xlsx"; // Static URL
    const label = "downloaded-file"; // Static label
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
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      //@ts-ignore
      fetchStudentDatabasebyDatabaseId(page, statusFilter, searchQuery);
    }
  }; 
  if (loading) {
    return <Loader/>;
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
        <div className="lg:text-3xl text-deepblue w-full">{database?.name}</div>
        <div className="flex w-full justify-end pr-2 sm:pr-4 gap-2 sm:gap-3">
  
  {/* Import Button */}
  <label className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-deepblue 
    hover:from-green-900 hover:to-parrotgreen text-white rounded-lg 
    text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5 transition">
    + Import
    <input
      type="file"
      accept=".csv,.xlsx"
      onChange={handleFileChange}
      className="hidden"
    />
  </label>

  {/* Export Button */}
  {role === "ADMIN" && <label className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-deepblue 
    hover:from-green-900 hover:to-parrotgreen text-white rounded-lg 
    text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5 transition"
    onClick={handleExport}>
     Export
  </label>}
  {/* Sample Sheet Download Button */}
  <button
    className="flex items-center bg-gradient-to-r from-blue-900 to-deepblue 
      hover:from-green-900 hover:to-parrotgreen text-white rounded-lg 
      text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5 
      transition"
    onClick={handleDownload}
  >
    <FontAwesomeIcon icon={faDownload} className="text-sm sm:text-base md:text-lg pr-1" />
    Sample Sheet
  </button>

        </div>
      </div>
      <div className="my-4 flex gap-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)} 
          placeholder="Search by name"
          className="border p-2 w-full lg:w-1/3 rounded-lg"
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
          //@ts-ignore
          db={currentPage - 1}
          // handleView={handleView}
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
      <DatabasePageContent />
    </Suspense>
  );
};
export default DatabasePage;