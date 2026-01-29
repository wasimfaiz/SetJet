"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTrashCan,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import Loader from "@/app/components/loader";
import Link from "next/link";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import Table from "../../components/table";
import DeleteModal from "../../components/deletemodel";
import Pagination from "../../components/pagination";
import Modal from "../../components/genericModal";
import RouteGuard from "../../components/routegaurd";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import apiClient from "../../utils/apiClient";
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
const categories= [ "GROUND", "WALKING"]
const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Assigned to", accessor: "to", type: "employeeId" },
  { header: "Assigned at", accessor: "assignedAt", type: "dateTime" },
  {header: "Status", accessor:"status", type:"text"}
];

const LeadsContentPage = () => {
  const router = useRouter();
  const params = useParams();
  const { permissions } = usePermissions();
  
  const { id } = params;
  const { employeeId, employeeName,employeeEmail} = useEmployeeContext();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setPageLimit] = useState(10);
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [totalStatus, setTotalStatus] = useState<boolean>(false); 
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedLeadCategory, setSelectedLeadCategory] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [skipCount, setSkipCount] = useState(0);

  const fetchStudentleadsbyleadsId = async (page : any, searchTerm : string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/leads/student-leads?employeeId=${employeeId}&page=${currentPage}&searchTerm=${searchTerm}&limit=${limit}&category=${selectedLeadCategory}&date=${selectedDate}&status=${statusFilter}`
      );
      setContacts(response?.data?.students);
      setTotalPages(response?.data?.totalPages);
      setTotalStatus(response?.data?.totalStatusCount)
      setTotalAllCount(response?.data?.totalCount)
    } catch (err) {
      setError("Failed to load student leads.");
    } finally {
      setLoading(false);
    }
  }; 
  const handleSearch = (query: string) => {
    setSearchQuery(query);
   fetchStudentleadsbyleadsId(1,query)
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (employeeId) {
        console.log("Fetching data for page:", currentPage);
        fetchStudentleadsbyleadsId(currentPage, searchQuery);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [employeeId, currentPage, searchQuery, selectedLeadCategory, selectedDate, statusFilter]);  

  const handleDelete = async () => {
    console.log("selected", selectedItem);
    console.log("selected rows", selectedRows);
  
    if (!selectedItem && (!selectedRows || selectedRows.length === 0)) return;
  
    try {
      if (selectedItem) {
        // Deleting a single item
        await apiClient.delete(`/api/leads/student-leads?id=${selectedItem._id}`);
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== selectedItem._id)
        );
      } else if (selectedRows.length > 0) {
        // Deleting multiple items (Send as JSON body)
        await apiClient.delete(`/api/leads/student-leads`, {
          data: { ids: selectedRows }, // Send IDs in the request body
        });
  
        setContacts((prevContacts) =>
          //@ts-ignore
          prevContacts.filter((contact) => !selectedRows.includes(contact._id))
        );
      }
  
      setShowModal(false);
      setSelectedRows([])
    } catch (error) {
      console.error("Error deleting student data:", error);
      setError("Failed to delete student data.");
    } finally {
      await fetchStudentleadsbyleadsId(currentPage, searchQuery);
    }
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/leads/${item._id}`);
  };
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      {checkButtonVisibility(permissions, "lead", "delete") && (
        <button className="h-5 w-5 text-bloodred" onClick={() => openDeleteModal(item)}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );
  const validateData = (data: any[], headers: string[]) => {    
    const missingHeaders = headers.filter(header => !data?.[0]?.hasOwnProperty(header));
    if (missingHeaders.length > 0) {
      alert(`Missing required headers: ${missingHeaders.join(", ")}`);
      return false;
    }
    return true;
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const importedData = results.data;
          console.log("Parsed CSV Data:", importedData);
  
          if (!validateData(importedData, results.meta.fields || [])) return;
          
          importContacts(importedData);
        },
        error: (error) => console.error("Error parsing CSV file:", error),
      });
    } 
    else if (file.name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) return;
  
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
        console.log("Parsed Excel Data:", sheetData);
        
        if (!Array.isArray(sheetData) || sheetData.length < 2) {
          console.error("Invalid Excel structure");
          return;
        }
  
        const headers: string[] = sheetData[0] as string[];
  
        // 🔍 **Detect and Log Potential Issues**
        console.log("Total Rows in sheetData:", sheetData.length);
        
        // Check for duplicate header row within data
        const duplicateHeaderIndex = sheetData.findIndex((row, index) => 
          index > 0 && JSON.stringify(row) === JSON.stringify(headers)
        );
        if (duplicateHeaderIndex !== -1) {
          console.warn(`⚠️ Duplicate header row found at row ${duplicateHeaderIndex + 1}! Removing it.`);
          sheetData.splice(duplicateHeaderIndex, 1);
        }
        //@ts-ignore
        const processedData = sheetData.slice(1).map((row: any[], rowIndex: number) => {
          if (!row || row.every((cell) => cell === undefined || cell === "")) {
            console.warn(`⚠️ Skipping empty row at index ${rowIndex + 1}:`, row);
            return null; // Mark empty rows
          }
          const rowWithEmptyValues: Record<string, any> = {};
          headers.forEach((header, index) => {
            rowWithEmptyValues[header] = row[index] || "";
          });
  
          return rowWithEmptyValues;
        }).filter(Boolean); // Remove `null` rows
  
        console.log("Total Rows in processedData:", processedData.length);
        console.log("Last 5 Rows of sheetData:", sheetData.slice(-5));
        console.log("Last 5 Rows of processedData:", processedData.slice(-5));
  
        if (!validateData(processedData, headers)) return;
  
        importContacts(processedData);
      };
      reader.readAsArrayBuffer(file);
    }
  };
  const handleSelectAll = (isChecked : any) => {
    if (isChecked) {
      const allIds = contacts.map((item) => item._id);
      //@ts-ignore
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
    };
  //@ts-ignore
  const handleRowSelect = (isChecked, rowId) => {
    //@ts-ignore
    setSelectedRows((prevSelected) => {
      if (isChecked) {
        return [...prevSelected, rowId]; // Add row ID
      }
      return prevSelected.filter((_id) => _id !== rowId); // Remove row ID
    });
  };
  const openModal = (message: string) => {
  setModalMessage(message);
  setIsModalOpen(true);
  };
  const closeModal = () => {
    setModalMessage(null);
    setIsModalOpen(false);
    setSelectedItem(null)
  };
  const openEmployeeSelectModal = (item: any) => {
    setShowModal(true);
  }; 
  const importContacts = async (data : any) => {
    setIsImporting(true);
    setProgress(0);

    try {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const createdAt = new Date(now.getTime() + istOffset);
      const updatedData = data.map((contact : any) => ({
        ...contact,
        by:employeeId,
        leadCategory:"GROUND",
        
        createdAt: createdAt,
      }));
      console.log(updatedData);
      
      const response = await apiClient.post(`/api/leads/student-leads/import`, updatedData);
      console.log(response.data?.duplicateEntries);
      setSkipCount(response.data?.skippedDuplicates)

      const duplicateEntries = response.data?.duplicateEntries;
  
      // Convert duplicate entries array to a formatted string
      const formattedDuplicateEntries = duplicateEntries?.map((entry: { phoneNumber: string, name: string }) => {
        return `Duplicate Entries: \n Name: ${entry.name}, Phone: ${entry.phoneNumber}`;
      }).join("\n");
  
      openModal(formattedDuplicateEntries);
  
      await apiClient.post(`/api/leads`, { employeeId, employeeName, employeeEmail });
  
      fetchStudentleadsbyleadsId(currentPage, searchQuery);
    } catch (error) {
      console.error("Error importing contacts:", error);
      alert("Error importing contacts.");
    } finally {
      setIsImporting(false);
    }
  };
  const handleDownload = async () => {
    const url = "https://europassimmigration.s3.us-east-1.amazonaws.com/excelSheet/ExcelSheet.xlsx"; // Static URL
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
      fetchStudentleadsbyleadsId(page, searchQuery);
    }
  };  
  if (loading && !searchQuery) {
    return <Loader />;
  }
  return (
  <RouteGuard requiredPermission="lead">
    <div className="container mx-auto px-4">
      
      {/* Header: Title + Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
        <h2 className="text-xl lg:text-3xl text-deepblue font-bold mx-2">Ground Leads</h2>

        {checkButtonVisibility(permissions, "lead", "add") && (
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/leadSystem/leads/add"
              className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-2 lg:px-6 py-2 lg:py-4 rounded-lg hover:bg-parrotgreen transition"
            >
              + Add Lead
            </Link>

            {/* Import CSV/XLSX */}
            <label className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-2 lg:px-6 py-2 lg:py-4 rounded-lg cursor-pointer">
              + {isImporting ? "Importing..." : "Import"}
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Download Sample Sheet */}
            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-2 lg:px-6 py-2 lg:py-4 rounded-lg flex items-center"
            >
              <FontAwesomeIcon icon={faDownload} className="text-xl pr-2" />
              Sample Excel Sheet
            </button>
          </div>
        )}
      </div>

      {/* Filters: Search, Category, Date */}
      <div className="my-4 flex flex-wrap gap-3 mx-2">
        
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-1 w-full md:w-1/3 rounded-lg shadow-sm"
        />

        {/* Lead Category Filter */}
        <div className="relative w-full md:w-1/3">
          <select
            className="border border-gray-300 rounded-lg p-1 w-full focus:ring focus:ring-deepblue focus:outline-none"
            value={selectedLeadCategory || ""}
            onChange={(e) => setSelectedLeadCategory(e.target.value)}
          >
            <option value="">Lead Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {selectedLeadCategory && (
            <button
              className="absolute right-3 top-3 text-gray-500 hover:text-red-500"
              onClick={() => setSelectedLeadCategory("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filter */}
        <input
          type="date"
          value={selectedDate || ""}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-1 w-full md:w-1/3 rounded-lg shadow-sm"
        />
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2 overflow-x-auto p-1 mt-2 mx-2">
      {statusOptions.map((status) => {
          const statusColorMap = {
            ALL: "bg-yellow-500",
            CONVERTED: "bg-parrotgreen text-deepblue hover:bg-green-100",
            "PAYMENT MODE": "bg-green-800 text-green-900 hover:bg-green-400",
            INTERESTED: "bg-green-500 text-green-900",
            "NOT INTERESTED": "bg-red-500 text-red-900",
            DNP: "bg-orange-600 text-orange-900",
            "FOLLOW UP": "bg-red-400 text-deepblue",
            "SWITCH OFF": "bg-blue-400 text-deepblue",
            "CALL DISCONNECTED": "bg-purple-400 text-purple-700",
            OTHERS: "bg-teal-500 text-teal-800",
            "TOTAL CALLS": "bg-green-900 text-white",
          };
          //@ts-ignore
          const count = status === "ALL" ? totalAllCount : totalStatus?.[status] || 0;

          return (
            <button
              key={status}
              //@ts-ignore
              className={`px-1 py-1 rounded-lg text-sx transition ${statusColorMap[status] || "bg-gray-300"} ${statusFilter === status ? "border-2 border-black" : "text-white"}`}
              onClick={() => {
                setStatusFilter(status);
                changePage(currentPage);
              }}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Table + Pagination */}
      <section className="my-5 mx-2">
        
        {/* Delete Selected Button */}
        {checkButtonVisibility(permissions, "lead", "delete") && (
        <button
          className={`p-1 mb-2 rounded-lg ${selectedRows?.length > 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-300 cursor-not-allowed"}`}
          onClick={openEmployeeSelectModal}
          disabled={selectedRows?.length === 0}
        >
          Delete Selected
        </button>)}

        {/* Leads Table */}
        <Table
          data={contacts}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
          db={currentPage - 1}
          pagination="manual"
          itemsPerPage={limit}
          checkboxEnabled={true}
          //@ts-ignore
          handleSelectAll={handleSelectAll} handleRowSelect={handleRowSelect} selectedRows={selectedRows}
        />
      </section>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageLimitChange={(limit) => {
          setPageLimit(limit);
          changePage(currentPage);
        }}
        pageLimit={limit}
      />

      {/* Import Progress Bar */}
      {isImporting && (
        <div className="mt-4 w-full bg-gray-200 rounded">
          <div
            className="bg-blue-500 text-xs font-medium text-white text-center p-1 leading-none rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />

      {/* Import Success Modal */}
      {isModalOpen && modalMessage && (
        <Modal
          title={`Success importing! Skipped(${skipCount})`}
          description={modalMessage}
          onClose={closeModal}
        />
      )}

    </div>
  </RouteGuard>
  );
};
const LeadsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadsContentPage />
    </Suspense>
  );
};
export default LeadsPage;
