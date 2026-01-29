"use client";

import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Table from "../../../components/table";
import { useRouter } from "next/navigation";
import { useEmployeeContext } from "../../../contexts/employeeContext";
import Loader from "../../../components/loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft, faBell, faDatabase, faEye, faFilter, faPhone, faTimes, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import CourseModal from "../../../components/courseModal";
import DbStatusModal from "../../../components/dbStatusModal";
import RemarkModal from "../../../components/remarkModal";
import CallModal from "../../../components/callModal";
import Pagination from "../../../components/pagination";
import TransferModal from "../../../components/transferModal";
import { usePersistentTab } from "../../../hooks/usePersistentTab";
import { usePersistentPage } from "../../../hooks/usePersistentPage";
import ReminderModal from "../../../components/reminderModal";
import EmployeeListModal from "../../../components/employeeModal";
import apiClient from "../../../utils/apiClient";
import usePersistentState from "../../../hooks/usePersistentState";

const options = [
  { value: "LEADS", label: "ALL LEADS" },
  { value: "DATABASE LEADS", label: "DATABASE" },
  { value: "B2B", label: "B2B LEADS" },

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
const courseOptions = [
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
]
const leadsColumns = [
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

const DatabaseContentPage = () => {
  const router = useRouter();
  const { employeeId, employeeName } = useEmployeeContext();

  const [leads, setLeads] = useState<any[]>();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = usePersistentState("myb2b-filter-search",  "");
  const [statusFilter, setStatusFilter] = usePersistentState("myb2b-filter-status",  "");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { activeTab, changeTab } = usePersistentTab("B2B");
    
  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setPageLimit] = useState(10);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [totalStatus, setTotalStatus] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lookingFor, setLookingFor] = usePersistentState("myb2b-filter-course",  "");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);

  // Fetch leads for a given status and page
  const fetchLeads = async (status: string, currentPage: number) => {
    setLoading(true);
    try {
      if (!employeeId) return;
      // Build the base URL with common query parameters
      let url = `/api/business/business-leads?assignId=${employeeId}&status=${status}&page=${currentPage}&limit=${limit}&searchTerm=${searchQuery}&course=${lookingFor}&sort=sort`;
      // Append category based on the activeTab
      if (activeTab === "GROUND LEADS") {
        url += "&category=GROUND";
      } else if (activeTab === "WALKING LEADS") {
        url += "&category=WALKING";
      }
      console.log("Fetching leads from URL:", url); // Debug log
      const response = await apiClient.get(url);
      setLeads({
        //@ts-ignore
        data: response.data.businesses || [],
        totalStatusCount: response.data.totalStatusCount || 0,
        totalCount: response.data.totalCount || 0,
      });
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to fetch leads.");
    } finally {
      setLoading(false);
    }
  };
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    changePage(1)
    fetchLeads(statusFilter, currentPage)
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
          fetchLeads(statusFilter, currentPage)
          setShowRemarkModal(false);
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
          fetchLeads(statusFilter, currentPage)
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
          setShowCourseModal(false);
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
          fetchLeads(statusFilter, currentPage)
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleTransfer = async (transferTo: { id: string }) => {
    // 1) Determine which leads to transfer
    const leadIds: string[] = [];
    if (selectedRows?.length) {
      leadIds.push(...selectedRows);
    } else if (selectedItem?._id) {
      leadIds.push(selectedItem._id);
    }

    if (!leadIds.length || !employeeId) return;

    // 2) Compute IST transferAt timestamp
    const now = Date.now();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset
    const transferAt = new Date(now + istOffset).toISOString();

    // 3) Payload common fields
    const payload = {
      transferTo: transferTo.id,
      transferFrom: employeeId,
      transferAt,
    };

    try {
      // 4) Update
      await apiClient.post("/api/business/business-leads/transfer", {
        ids: leadIds,
        ...payload
      });

      // 5) Refresh & close
      fetchLeads(statusFilter, currentPage);
      setSelectedItem(null);
      setSelectedRows([]);
      setShowStatusModal(false);
    } catch (err) {
      console.error("Error updating transfer:", err);
    }
  };
  const handleSelectAll = (isChecked: boolean) => {
    //@ts-ignore
    const allIds = isChecked ? leads?.data?.map((item : any) => item._id) : [];
    setSelectedRows(allIds);
  };
  const handleRowSelect = (isChecked: boolean, rowId: string) => {
    setSelectedRows((prev) =>
      isChecked ? [...prev, rowId] : prev.filter((id) => id !== rowId)
    );
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/mydatabaseleads/myleads/${item._id}`);
  };
  const handleNavigation = (tab: string) => {
    changePage(1)
    if (tab === "DATABASE LEADS"){
      router.push("/leadSystem/mydatabaseleads/mydatabase");
    }
    else if (tab === "LEADS"){
      router.push("/leadSystem/mydatabaseleads");
    }
    else {
      changeTab(tab)
      setStatusFilter("ALL")
      fetchLeads("ALL", 1)
    }
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      // fetchClientsByStatus(statusFilter, searchQuery, page);
    }
  };
  const handleEmployee = async (empId: string, empName: string) => {
    if (!selectedRows.length) {
      console.warn("No selected rows to assign.");
      return;
    }
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const payload = { transferTo: { id: empId, name: empName }, transferFrom: { id: employeeId, name: employeeName }, transferAt: istDate, ids: selectedRows };
    try {
      const response = await apiClient.post(`/api/business/business-leads/transfer`, payload);
      if (response.status === 200) {
        fetchLeads(statusFilter, currentPage)
        setShowEmployeeModal(false);
        setSelectedRows([]);
      } else {
        console.error("Failed to assign employee:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
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
  const openReminderModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  const openEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowEmployeeModal(true);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (employeeId) {
        fetchLeads(statusFilter, currentPage)
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [employeeId, activeTab, statusFilter, currentPage, limit,showCourseModal, searchQuery, lookingFor]);

  const renderActions = (item: any) => (
    <>
      <button title="Transfer" className="h-5 w-5" onClick={() => openTransferModal(item)}>
        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
      </button>
      <button title="Call" className="h-5 w-5" onClick={() => openCallModal(item)}>
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button title="Set Reminder" className="h-5 w-5" onClick={() => openReminderModal(item)}>
        <FontAwesomeIcon icon={faBell} />
      </button>
      <button title="View" className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
    </>
  );
  if (loading && !searchQuery) {
    return <Loader />;
  }
  return (
<div className="container my-10">
  <div className="flex items-center justify-between mt-5 mx-2">
    <h1 className="md:text-2xl text-base text-deepblue w-full">
      My Database & Ground Leads
    </h1>
  </div>

  <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2">
    {options.map((location) => (
      <div
        key={location.value}
        onClick={() => handleNavigation(location.value)}
        className={`cursor-pointer px-1 py-1 md:px-2 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
          location.value === "B2B"
            ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white hover:bg-gradient-to-r hover:from-green-700 hover:to-parrotgreen"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <div className="flex items-center justify-start gap-1">
          <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
            <FontAwesomeIcon icon={faDatabase} className="text-green-800 h-4 w-4" />
          </div>
          <div className="lg:text-xs text-[8px] font-semibold text-center">
            {location.label}
          </div>
        </div>
      </div>
    ))}
  </div>

  <div className="flex space-x-2 overflow-x-auto p-1 mt-2 mx-2">
    {statusOptions.map((status) => {
      let statusColor = "bg-gray-300";
      if (status === "ALL") statusColor = "text-xs bg-yellow-500";
      if (status === "CONVERTED")
        statusColor =
          "rounded-lg bg-parrotgreen text-deepblue text-xs font-medium hover:bg-green-100 hover:text-white";
      if (status === "PAYMENT MODE")
        statusColor =
          "rounded-lg bg-green-800 text-green-900 text-xs font-medium hover:bg-green-400 hover:text-white";
      if (status === "INTERESTED")
        statusColor =
          "rounded-lg bg-green-500 text-green-900 text-xs font-medium hover:bg-green-900 hover:text-white";
      if (status === "NOT INTERESTED")
        statusColor =
          "rounded-lg bg-red-500 text-red-900 text-xs font-medium hover:bg-red-900 hover:text-white";
      if (status === "DNP")
        statusColor =
          "rounded-lg bg-orange-600 text-orange-900 text-xs font-medium hover:bg-orange-700 hover:text-white";
      if (status === "FOLLOW UP")
        statusColor =
          "rounded-lg bg-red-400 text-deepblue text-xs font-medium hover:bg-red-500 hover:text-white";
      if (status === "SWITCH OFF")
        statusColor =
          "rounded-lg bg-blue-400 text-deepblue text-xs font-medium hover:bg-blue-600 hover:text-white";
      if (status === "CALL DISCONNECTED")
        statusColor =
          "rounded-lg bg-purple-400 text-purple-700 text-xs font-medium hover:bg-purple-600 hover:text-white";
      if (status === "OTHERS")
        statusColor =
          "rounded-lg bg-teal-500 text-teal-800 text-xs font-medium hover:bg-teal-700 hover:text-white";
      if (status === "TOTAL CALLS")
        statusColor =
          "rounded-lg bg-green-900 text-white text-xs font-medium hover:bg-green-800 hover:text-white";
      //@ts-ignore
      const statusCount = totalStatus?.[status] || 0;
      let countToShow = 0;
      if (status === "ALL") {
        //@ts-ignore
        countToShow = leads?.totalCount || 0;
      } else {
        //@ts-ignore
        countToShow = leads?.totalStatusCount?.[status || 0];
      }
      return (
        <button
          key={status}
          className={`px-1 py-1 rounded-lg text-white ${statusColor} ${
            statusFilter === status ? "ring-1 ring-offset-1 ring-deepblue" : ""
          }`}
          onClick={() => handleStatusFilter(status)}
        >
          {status} ({countToShow || 0})
        </button>
      );
    })}
  </div>

  <div className="flex flex-wrap gap-2 my-3 mx-2">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search by name or mobile"
      className="border p-1 w-full md:w-1/2 rounded-lg text-xs"
    />
    <div className="relative flex flex-col w-48">
      <div className="relative">
        <select
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
          className="border p-1 rounded-lg w-full text-xs"
        >
          <option value="">All Courses</option>
          {courseOptions.map((course, index) => (
            <option key={index} value={course.value}>
              {course.value}
            </option>
          ))}
        </select>
        {lookingFor && (
          <button
            onClick={() => setLookingFor("")}
            className="absolute right-3 top-1 text-gray-500 hover:text-bloodred text-xs"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>
    </div>
  </div>
  {/* Action Buttons */}
  <div className="flex mx-2 items-center mb-5">
    <button
      disabled={selectedRows.length <= 0}
      className={`py-2 px-4 rounded-lg ${
      selectedRows.length > 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-300"
      }`}
      onClick={openTransferModal}
      >
        Transfer to Employee
    </button>
  </div>  
  <div className="my-1 mx-2">
    <Table
      //@ts-ignore
      data={leads?.data}
      //@ts-ignore
      columns={leadsColumns}
      onStatusChangeClick={openStatusModal}
      onCourseChangeClick={openCourseModal}
      onRemarkChangeClick={openRemarkModal}
      actions={renderActions}
      pagination="manual"
      itemsPerPage={limit}
      onEmployeeSelect={openTransferModal}
      db={currentPage - 1}
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
      pageLimit={limit}
    />
  </div>
  <EmployeeListModal
    show={showEmployeeModal}
    onClose={() => setShowEmployeeModal(false)}
    handleEmployee={handleEmployee}
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
    initialValues={selectedItem?.remark}
    initialDates={selectedItem?.remarkUpdatedAt}
  />
  <CallModal
    show={showCallModal}
    onClose={() => setShowCallModal(false)}
    onCall={handleCalling}
    contact={selectedItem}
  />
  <TransferModal
    show={showTransferModal}
    onClose={() => setShowTransferModal(false)}
    onTransferClient={handleTransfer}
  />
  {/* @ts-ignore */}
  {isModalOpen && <ReminderModal type="lead" onClose={() => setIsModalOpen(false)} selectedItem={selectedItem} />}
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
export default DatabasePage