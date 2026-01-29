"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faEye,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";
import Table from "../../components/table";
import DeleteModal from "../../components/deletemodel";
import Pagination from "../../components/pagination";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import EmployeeListModal from "../../components/employeeModal";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import { usePersistentView } from "../../hooks/usePersistentView";
import SearchableSelect from "../../components/searchableSelect";
import usePersistentState from "../../hooks/usePersistentState";
import apiClient from "../../utils/apiClient";
import { useEmployeeContext } from "@/app/contexts/employeeContext";

interface Counts {
  [key: string]: number;
}

interface Option {
  value: string;
  label: string;
}

const statusOptions: string[] = [
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

const options: Option[] = [
  { value: "ALL LEADS", label: "ALL LEADS" },
  { value: "EMPLOYEE LEADS", label: "EMPLOYEE LEADS" },
  { value: "WALKING LEADS", label: "WALKING LEADS" },
];

const categories = ["UNASSIGNED", "ASSIGNED"];
const types = ["GROUND", "WALKING"];

const columnsModal = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Created at", accessor: "createdAt", type: "dateTime" },
  { header: "Assigned to", accessor: "to", type: "employeeId" },
  { header: "Assigned by", accessor: "by", type: "employeeId" },
  { header: "Assigned at", accessor: "assignedAt", type: "dateTime" },
  { header: "Status", accessor: "status", type: "text" },
];
const detailedColumns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "State", accessor: "state", type: "text", hideOnMobile: true },
  { header: "Called at", accessor: "calledAt[0]", type: "dateTime" },
  { header: "Status", accessor: "status", type: "text" },
  { header: "Looking for", accessor: "course", type: "text" },
  { header: "Remark", accessor: "remark[0]", type: "text" },
];

const LeadsPageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { role } = useEmployeeContext();

  // Core States
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [counts, setCounts] = useState<Counts | undefined>(undefined);
  const [statusFilter, setStatusFilter] = usePersistentState("leadmanage-filter-status",  "");
  const [interestedFollowClients, setInterestedFollowClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = usePersistentState("leadmanage-filter-search",  "");
  const [employees, setEmployees] = useState<any[]>([]);
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState<number>(125);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const { activeView, changeView } = usePersistentView("leadView");

  // Filter States
  const [assigned, setAssigned] = usePersistentState("leadmanage-filter-assign",  "UNASSIGNED");
  const [course, setCourse] = usePersistentState("leadmanage-filter-course",  "");
  const [selectedEmployee, setSelectedEmployee] = usePersistentState("leadmanage-filter-employee",  "");
  const [date, setDate] = usePersistentState("leadmanage-filter-date",  "");
  const [calledAtDate, setCalledAtDate] = usePersistentState("leadmanage-filter-call",  "");
  const [selectedLeadCategory, setSelectedLeadCategory] = usePersistentState("leadmanage-filter-category",  "");

  // useRef for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTotalByStatus = async (page = currentPage, status: string, search: string) => {
    try {
      setLoading(true);
      let url = `/api/leads/student-leads/total?page=${page}&status=${status}&searchTerm=${search}&limit=${pageLimit}&assigned=${assigned}&assignId=${selectedEmployee}&date=${date}&calledAtDate=${calledAtDate}&course=${course}&category=${selectedLeadCategory}`;
      const response: any = await apiClient.get(url);
      const { students, statusCounts, totalPages, totalCount } = response.data;
      setInterestedFollowClients(students);
      setTotalPages(totalPages);
      const mappedCounts: Counts = Object.entries(statusCounts).reduce(
        (acc, [key, count]) => {
          //@ts-ignore
          acc[key] = count;
          return acc;
        },
        {} as Counts
      );
      mappedCounts["ALL"] = totalCount;
      setCounts(mappedCounts);
    } catch (err) {
      console.error("Error fetching total by status:", err);
      setError("Failed to fetch total by status.");
    } finally {
      setLoading(false);
    }
  };
  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get(`/api/employees`);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format");
      }
      const employeesData = response.data
        .map((employee: any) =>
          employee.basicField?.email && employee._id
            ? { label: employee.basicField.email, value: employee._id }
            : null
        )
        .filter(Boolean);
      setEmployees(employeesData);
    } catch (error: any) {
      console.error("Error fetching employees:", error.message);
      setError(error.message || "Failed to fetch employee list.");
    }
  };

  // --- Handlers ---
  const handleNavigation = (tab: string) => {
    if (tab === "EMPLOYEE LEADS") router.push("/leadSystem/leadmanage/employeeLead");
    if (tab === "WALKING LEADS") router.push("/leadSystem/leadmanage/walkingLead");
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchTotalByStatus(1, statusFilter, query);
    }, 500);
  };
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/leads/student-leads?id=${selectedItem._id}`);
        setContacts((prev) =>
          prev.filter((contact) => contact._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting student data:", error);
        setError("Failed to delete student data.");
      }
    }
  };
  const handleStatusFilter = (status: string) => {
    if (status === "ALL") {
      setStatusFilter("");
      fetchTotalByStatus(1, "", "");
    } else {
      setStatusFilter(status);
      fetchTotalByStatus(1, status, "");
    }
  };
  const handleSelectAll = (isChecked: boolean) => {
    const allIds = isChecked ? interestedFollowClients.map((item) => item._id) : [];
    setSelectedRows(allIds);
  };
  const handleRowSelect = (isChecked: boolean, rowId: string) => {
    setSelectedRows((prev) =>
      isChecked ? [...prev, rowId] : prev.filter((id) => id !== rowId)
    );
  };
  const handleEmployee = async (empId: string, empName: string) => {
    if (!selectedRows.length) {
      console.warn("No selected rows to assign.");
      return;
    }
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const payload = { to: empId, assignedAt: istDate , ids: selectedRows };
    try {
      const response = await apiClient.post(`/api/leads/student-leads/assign`, payload);
      if (response.status === 200) {
        fetchTotalByStatus(currentPage, statusFilter, searchQuery);
        setShowEmployeeModal(false);
        setSelectedRows([]);
      } else {
        console.error("Failed to assign employee:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/leads/student-leads/export?&status=${statusFilter}&searchTerm=${searchQuery}&assigned=${assigned}&assignId=${selectedEmployee}&date=${date}&calledAtDate=${calledAtDate}&course=${course}&category=${selectedLeadCategory}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to export Excel");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-leads-${statusFilter}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Excel export failed:", error);
    }
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/leadmanage/${item?.by?.employeeId}/${item?._id}`);
  };
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      {checkButtonVisibility(permissions, "leadmanage", "delete") && (
        <button className="h-5 w-5 text-bloodred" onClick={() => openDeleteModal(item)}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const openEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowEmployeeModal(true);
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchTotalByStatus(page, statusFilter, searchQuery);
    }
  };

  // --- useEffect Hooks ---
  // On mount: fetch employees, leads group and totals
  useEffect(() => {
    fetchEmployees();
  }, []); 
  // When filters change, reset page and fetch totals (using debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTotalByStatus(currentPage, statusFilter, searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, assigned, selectedEmployee, date, selectedLeadCategory, calledAtDate, course, pageLimit, currentPage]);

  if (loading && !searchQuery) return <Loader />;

  return (
  <div className="container mx-auto px-4">
    {/* Heading */}
    <div className="flex flex-col md:flex-row items-center justify-between px-4 mt-6 md:mt-10">
      <h1 className="text-lg md:text-3xl text-deepblue w-full">Leads Management</h1>
        {/* Export Button */}
        {role === "ADMIN" && <label className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-deepblue 
          hover:from-green-900 hover:to-parrotgreen text-white rounded-lg 
          text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2.5 transition"
          onClick={handleExport}>
          Export
        </label>}
    </div>

    {/* Lead Type Tabs */}
    <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2">
      {options.map((location) => (
        <div
          key={location.value}
          onClick={() => handleNavigation(location.value)}
          className={`cursor-pointer px-1 py-1 md:px-2 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
            location.value === "ALL LEADS"
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
    {/* Status Filter Buttons */}
    <div className="flex space-x-2 overflow-x-auto p-1 mt-2 mx-2">
    {statusOptions.map((status) => {
      let statusColor = "bg-gray-300";
      if (status === "ALL") statusColor = "text-xs bg-yellow-500";
      if (status === "CONVERTED")
        statusColor =
          "rounded-lg bg-parrotgreen text-white text-xs font-medium hover:bg-green-100 hover:text-white";
      if (status === "PAYMENT MODE")
        statusColor =
          "rounded-lg bg-green-800 text-green-100 text-xs font-medium hover:bg-green-400 hover:text-white";
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
        return (
          <button
            key={status}
            className={`px-3 py-1 rounded-lg text-xs md:text-sm font-medium ${statusColor} ${
              statusFilter === status ? "ring-2 ring-offset-1 ring-deepblue" : ""
            }`}
            onClick={() => handleStatusFilter(status)}
          >
            {status} ({counts?.[status] || 0})
          </button>
        );
      })}
    </div>
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
                    : "bg-gray-100 border-purple-500 border-2 text-gray-700 hover:bg-gray-200"}
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
          onChange={(e) => { setDate(e.target.value); changePage(1); }}
          className="px-2 py-1 border rounded-md w-full text-xs md:text-sm"
        />
        {date && (
          <button
            onClick={() => { setDate(""); changePage(1); }}
            className="absolute right-8 top-2 text-gray-400 hover:text-red-500 text-sm"
          >
            ✕
          </button>
        )}
      </div>
      {/* Employee Selection */}
      <div className="relative w-full md:w-1/6">
        <SearchableSelect
          options={employees}
          //@ts-ignore
          value={selectedEmployee} onChange={setSelectedEmployee}
          placeholder="Select Employee"
        />
          {selectedEmployee && (
            <button
              className="absolute right-1 top-3 text-gray-500 hover:text-red-500 text-xs"
              //@ts-ignore
              onClick={() => setSelectedEmployee("")}
            >
              ✕
            </button>
          )}
      </div>
        {/* Course Filter */}
        <div className="relative w-full md:w-1/6">
          <select
            className="border rounded-md px-2 py-2 w-full text-xs md:text-sm"
            value={course || ""}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="">Looking For</option>
            {courses.map((course) => (
              <option key={course.value} value={course.value}>
                {course.value}
              </option>
            ))}
          </select>
          {course && (
            <button
              onClick={() => setCourse("")}
              className="absolute right-5 top-2 text-gray-400 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        {/* Category Filter */}
        <div className="relative w-full md:w-1/6">
          <select
            className="border border-gray-300 rounded-lg px-2 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none text-sm"
            value={selectedLeadCategory || ""}
            onChange={(e) => setSelectedLeadCategory(e.target.value)}
          >
            <option value="" label="Lead Category" />
            {types.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {selectedLeadCategory && (
            <button
              onClick={() => setSelectedLeadCategory("")}
              className="absolute right-2 top-2 text-gray-500 hover:text-red-500 text-base"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
    </div>
    {/* Action Buttons */}
    <div className="flex flex-wrap gap-2 md:gap-4 items-center mb-5 mx-2">
      <button
        disabled={selectedRows.length <= 0}
        className={`px-4 py-2 rounded-lg text-sm ${
          selectedRows.length > 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
        }`}
        onClick={openEmployeeSelectModal}
      >
        Assign to Employee
      </button>
      <button
        className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-700"
        onClick={() => changeView(activeView === "leadView" ? "employeeView" : "leadView")}
      >
        {activeView === "leadView" ? "Employee Detailed View" : "Leads View"}
      </button>
      {activeView === "employeeView" && (
        <div className="relative w-full md:w-1/6">
          <span className="text-sm">Called At Date</span>
          <input
            type="date"
            value={calledAtDate}
            onChange={(e) => { setCalledAtDate(e.target.value); changePage(1); }}
            className="px-2 py-1 border rounded-md w-full text-xs md:text-sm"
            />
          {calledAtDate && (
            <button
              onClick={() => { setCalledAtDate(""); changePage(1); }}
              className="absolute right-8 top-8 text-gray-400 hover:text-red-500 text-sm"
              >
              ×
            </button>
          )}
        </div>
      )}
    </div>

    {/* Table & Pagination */}
    <div className="my-5 mx-2">
      <Table
        data={interestedFollowClients}
        //@ts-ignore
        columns={activeView === "employeeView" ? detailedColumns : columnsModal}
        actions={renderActions}
        // handleView={handleView}
        pagination="manual"
        itemsPerPage={pageLimit}
        checkboxEnabled={true}
        db={currentPage - 1}
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

    <DeleteModal show={showModal} onClose={() => setShowModal(false)} onDelete={handleDelete} />
    <EmployeeListModal
      show={showEmployeeModal}
      onClose={() => setShowEmployeeModal(false)}
      handleEmployee={handleEmployee}
    />
  </div>
  );
};
const LeadsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadsPageContent />
    </Suspense>
  );
};
export default LeadsPage;
