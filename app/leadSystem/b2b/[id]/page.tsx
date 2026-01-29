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
  faEdit,
  faChevronUp,
  faChevronDown,
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
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import View from "@/app/components/view";
import Link from "next/link";
import EmployeeListModal from "@/app/components/employeeModal";

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
  { header: "Assigned To", accessor: "to", type: "employeeId" },
  { header: "Remark", accessor: "remark", type: "remark" },
];
const businessFields = [
    { label: "Business Type", value: "basic.businessType" },
    { label: "Institution Name", value: "basic.institutionName" },
    { label: "Contact Person", value: "basic.contactPersonName" },
    { label: "Designation", value: "basic.designation" },
    { label: "Email", value: "basic.emailAddress" },
    { label: "Phone Number", value: "basic.phoneNumber" },
    { label: "Alternate Phone", value: "basic.alternatePhoneNumber" },
    { label: "Website", value: "basic.website" },
    { label: "Country", value: "address.country" },
    { label: "State", value: "address.state" },
    { label: "City", value: "address.city" },
    { label: "Pincode", value: "address.pincode" },
    { label: "Full Address", value: "address.fullAddress" },
    { label: "Google Map Link", value: "address.googleMapLink" },
    { label: "Nature of Partnership", value: "details.natureOfPartnership" },
    { label: "Services Agreed", value: "details.servicesAgreedUpon" },
    { label: "Start Date", value: "details.agreementStartDate", type: "date" },
    { label: "End Date", value: "details.agreementEndDate", type: "date" },
    { label: "Status", value: "details.partnershipStatus" },
    { label: "Commission Type", value: "paymentInfo.commissionType" },
    { label: "Commission Rate", value: "paymentInfo.commissionRateOrAmount" },
    { label: "Payment Terms", value: "paymentInfo.paymentTerms" },
    { label: "Bank Name", value: "paymentInfo.bankName" },
    { label: "Account Holder", value: "paymentInfo.accountHolderName" },
    { label: "Account Number", value: "paymentInfo.accountNumber" },
    { label: "IFSC Code", value: "paymentInfo.ifscCode" },
    { label: "UPI ID", value: "paymentInfo.upiId" },
    { label: "MOU/Agreement", value: "documentation.mouAgreement", type: "file" },
    { label: "ID Proof", value: "documentation.idProof", type: "file" },
    { label: "Partner Logo", value: "documentation.partnerLogo", type: "file" },
    { label: "Relationship Manager", value: "remarks.relationshipManager.employeeName" },
    { label: "Last Interaction", value: "remarks.dateOfLastInteraction", type: "date" },
    { label: "Next Follow-up", value: "remarks.nextFollowUpDate", type: "date" },
    { label: "Reminders", value: "reminders", type: "objArray" },
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
const BusinessPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { employeeId } = useEmployeeContext();
  const { permissions } = usePermissions();
  
  const [business, setBusiness] = useState<any>([]);
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
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  
  const fetchStudentBusinessbyBusinessId = async (page = currentPage, status="ALL", searchTerm="") => {
    // setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/business/business-leads?businessId=${id}&page=${page}&limit=${pageLimit}&status=${status}&searchTerm=${searchTerm}`
      );
      setTotalStatus(response?.data?.totalStatusCount)
      setTotalAllCount(response?.data?.totalCount)
      setTotalCount(response?.data?.totalCount)
      setFilteredContacts(response?.data?.businesses);
      setTotalPages(response?.data?.totalPages);
    } catch (err) {
      setError("Failed to load business lead.");
    } finally {
      // setLoading(false);
    }
  }; 
  const handleSearch = (query: string) => {
    setSearchQuery(query);
   fetchStudentBusinessbyBusinessId(1, statusFilter,query)
  };
  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/business?id=${id}`);
      setBusiness(response?.data);
      console.log("business", response?.data);
    } catch (err) {
      setError("Failed to load business lead.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) {
      fetchBusiness();
    }
  }, [id]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentBusinessbyBusinessId();
    }, 500);
    return () => clearTimeout(timer);
  }, [pageLimit, currentPage]);
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(
          `/api/business/business-leads?id=${selectedItem._id}`
        );
        setFilteredContacts((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting student data:", error);
        setError("Failed to delete student data.");
      } finally {
        await fetchStudentBusinessbyBusinessId(currentPage, statusFilter); 

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
          `/api/business/business-leads?id=${selectedItem._id}`,
          payload
        );
        const phoneNumber = selectedItem.phoneNumber;
        console.log("Dialing:", phoneNumber);
        window.open(`tel:${phoneNumber}`);
        if (response.status === 200) {
          fetchStudentBusinessbyBusinessId(currentPage, statusFilter);
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
          `/api/business/business-leads?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentBusinessbyBusinessId(currentPage, statusFilter); // Fetch data for previous page
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
          `/api/business/business-leads?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentBusinessbyBusinessId(currentPage, statusFilter); // Fetch data for previous page
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
          `/api/business/business-leads?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchStudentBusinessbyBusinessId(currentPage, statusFilter); // Fetch data for previous page
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
   fetchStudentBusinessbyBusinessId(1, status, searchQuery)
  };
  const openModal = (message: string) => {
    setModalMessage(message);
    setIsModalOpen(true);
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
  const openEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowEmployeeModal(true);
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/b2b/${id}/lead/${item._id}`);
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
  const handleEdit = () => {
    router.push(`/leadSystem/b2b/add?id=${id}`);
  }
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      //@ts-ignore
      fetchStudentBusinessbyBusinessId(page, statusFilter, searchQuery);
    }
  }; 
  const handleSelectAll = (isChecked: boolean) => {
    const allIds = isChecked ? filteredContacts.map((item) => item._id) : [];
    setSelectedRows(allIds);
  };
  const handleRowSelect = (isChecked: boolean, rowId: string) => {
    setSelectedRows((prev) =>
      isChecked ? [...prev, rowId] : prev.filter((id) => id !== rowId)
    );
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
        by: employeeId,
        businessId: id,
        createdAt: createdAt,
      }));
      console.log(updatedData);
      
      const response = await apiClient.post(`/api/business/business-leads/import`, updatedData);
      console.log(response.data?.duplicateEntries);
      setSkipCount(response.data?.skippedDuplicates)

      const duplicateEntries = response.data?.duplicateEntries;
  
      // Convert duplicate entries array to a formatted string
      const formattedDuplicateEntries = duplicateEntries?.map((entry: { phoneNumber: string, name: string }) => {
        return `Duplicate Entries: \n Name: ${entry.name}, Phone: ${entry.phoneNumber}`;
      }).join("\n");
  
      openModal(formattedDuplicateEntries);
      fetchStudentBusinessbyBusinessId(currentPage, statusFilter); // Fetch data for previous page
    } catch (error) {
      console.error("Error importing contacts:", error);
      alert("Error importing contacts.");
    } finally {
      setIsImporting(false);
    }
  };
  const handleEmployee = async (empId: string, empName: string) => {
    if (!selectedRows.length) {
      console.warn("No selected rows to assign.");
      return;
    }
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const payload = { to: empId, assignedAt: istDate , ids: selectedRows };
    try {
      const response = await apiClient.post(`/api/business/business-leads/assign`, payload);
      if (response.status === 200) {
        fetchStudentBusinessbyBusinessId(currentPage, statusFilter); // Fetch data for previous page
        setShowEmployeeModal(false);
        setSelectedRows([]);
      } else {
        console.error("Failed to assign employee:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
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
  if (loading) {
    return <Loader/>;
  }
  return (
    <div className="container">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => router.push(`/leadSystem/b2b`)} className="text-blue-500 underline hover:text-deepblue">
          Back
        </button>
          {checkButtonVisibility(permissions, "b2b", "edit") && (
            <button onClick={handleEdit} className="text-deepblue px-4 py-2 rounded hover:text-blue-800 underline">
              Edit <FontAwesomeIcon icon={faEdit} />
            </button>
          )}
      </div>
      <div onClick={() => setDetailsOpen(open => !open)} className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen p-5 text-white w-full flex justify-between rounded-lg">
        <p>About {business?.basic?.institutionName}</p> {detailsOpen ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
      </div>
      {detailsOpen && business && (
        //@ts-ignore
        <View item={business} fields={businessFields} />
      )}
      <div className="my-4 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)} 
          placeholder="Search by name"
          className="border p-2 w-full lg:w-1/3 rounded-lg"
        />
        {checkButtonVisibility(permissions, "b2b", "add") && (
          <>
            <Link href={`/leadSystem/b2b/${id}/lead/add`} className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200">
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
          </>

        )}
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
      {/* Assign to Employee Button */}
      <div className="flex flex-wrap gap-2 md:gap-4 items-center my-2 mx-2">
        <button
          disabled={selectedRows.length <= 0}
          className={`px-4 py-2 rounded-lg text-sm ${
            selectedRows.length > 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
          }`}
          onClick={openEmployeeSelectModal}
        >
          Assign to Employee
        </button>
      </div>
      <div className="my-10 mx-2">
        <Table
          data={filteredContacts}
          //@ts-ignore
          columns={columns}
          checkboxEnabled={true}
          actions={renderActions}
          onStatusChangeClick={openStatusModal}
          onCourseChangeClick={openCourseModal}
          onRemarkChangeClick={openRemarkModal}
          //@ts-ignore
          db={currentPage - 1} handleSelectAll={handleSelectAll} handleRowSelect={handleRowSelect} selectedRows={selectedRows}
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
      <EmployeeListModal
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        handleEmployee={handleEmployee}
      />
    </div>
  );
};
const BusinessPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BusinessPageContent />
    </Suspense>
  );
};
export default BusinessPage;