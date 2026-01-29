"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrashCan, faDatabase } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import Table from "../../../components/table";
import DeleteModal from "../../../components/deletemodel";
import EmployeeListModal from "../../../components/employeeModal";
import Pagination from "@/app/components/pagination";
import SearchableSelect from "@/app/components/searchableSelect";
import apiClient from "@/app/utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Created at", accessor: "createdAt", type: "dateTime" },
  { header: "Assigned to", accessor: "to.name", type: "text" },
  { header: "Assigned at", accessor: "to.assignedAt", type: "dateTime" },
  { header: "Status", accessor: "status", type: "text" },
];

// Extra/detailed columns with one extra field (Email)
const detailedColumns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  // { header: "Email", accessor: "email", type: "text" },
  { header: "State", accessor: "state", type: "text", hideOnMobile: true },
  {
    header: "Called at",
    accessor: "calledAt[0]",
    type: "dateTime",
  },
  { header: "Status", accessor: "status", type: "text" },
  { header: "Looking for", accessor: "course", type: "text" },
  { header: "Remark", accessor: "remark", type: "text" },
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
const categories = ["UNASSIGNED", "ASSIGNED"];
const types = ["GROUND", "WALKING"];

const leadsPage = () => {
  const router = useRouter();
  const params = useParams();
  const { permissions } = usePermissions();
  const { id } = params; // employee id passed as route param

  // States
  const [employee, setEmployee] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [totalAllCount, setTotalAllCount] = useState<number>(0);
  const [assigned, setAssigned] = useState<string>("");
  const [totalStatus, setTotalStatus] = useState<any>(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [calledAtDate, setCalledAtDate] = useState<string>("");
  const [selectedLeadCategory, setSelectedLeadCategory] = useState<string>("");
  // State to toggle detailed view columns
  const [detailedView, setDetailedView] = useState<boolean>(false);

  // Ref to store debounce timeout
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // --- API Calls ---

  // Fetch employee data by employeeId for heading
  const fetchEmployeeData = useCallback(async (employeeId: string) => {
    try {
      const response = await apiClient.get(`/api/employees?id=${employeeId}`);
      // Assuming the employee name is stored in basicField.name
      setEmployee(response.data?.basicField?.name);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  }, []);

  // Fetch student leads with current filters
  const fetchStudentLeadsByLeadsId = useCallback(
    async (page = 1, status = "ALL", searchTerm = "") => {
      if (!id) return;
      setLoading(true);
      setError(null);
  
      try {
        let url = `/api/leads/student-leads?employeeId=${id}&page=${page}&searchTerm=${searchTerm}&limit=${pageLimit}&status=${status}&assigned=${assigned}&assignId=${selectedEmployee}&category=${selectedLeadCategory}&date=${date}&calledAtDate=${calledAtDate}`;
  
        // Append sort parameter if detailedView is enabled
        if (detailedView) {
          url += "&sort=sort";
        }
  
        const response = await apiClient.get(url);
        setContacts(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStatus(response.data.totalStatusCount);
        setTotalAllCount(response.data.totalCount);
      } catch (err) {
        setError("Failed to load student leads.");
      } finally {
        setLoading(false);
      }
    },
    [id, pageLimit, assigned, selectedEmployee, selectedLeadCategory, date, detailedView, calledAtDate] // Added `detailedView` as a dependency
  );  

  // Fetch employee list for assignment dropdown
  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get(`/api/employees?status=ACTIVE`);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format");
      }
      const employeesData = response.data
        .map((employee: any) => {
          if (!employee.basicField?.email || !employee._id) return null;
          return {
            label: employee.basicField.email,
            value: employee._id,
          };
        })
        .filter(Boolean);
      setEmployees(employeesData);
    } catch (error: any) {
      console.error("Error fetching employees:", error.message);
      setError(error.message || "Failed to fetch employee list.");
    }
  };

  useEffect(() => {
    //@ts-ignore
    if (id) fetchEmployeeData(id);
  }, [id, fetchEmployeeData]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Combined filter effect with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStudentLeadsByLeadsId(1, statusFilter, searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    searchQuery,
    statusFilter,
    assigned,
    selectedEmployee,
    date,
    selectedLeadCategory,
    fetchStudentLeadsByLeadsId,
  ]);

  // --- Handlers ---

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // The useEffect above handles the API call debouncing.
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    // The debounced useEffect will re-fetch data.
  };

  // Assign employee to a lead
  const handleEmployee = async (empId: string, empName: string) => {
    console.log("Employee Details:", empId, empName);
    if (!selectedRows || selectedRows.length === 0) {
      console.warn("No selected rows to assign.");
      return;
    }
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const payload = { to: { id: empId, name: empName, assignedAt: istDate }, ids: selectedRows };
    try {
      const response = await apiClient.post(`/api/leads/student-leads/assign`, payload);
      if (response.status === 200) {
        fetchStudentLeadsByLeadsId(currentPage, searchQuery);
        setShowEmployeeModal(false);
        setSelectedRows([]);
      } else {
        console.error("Failed to assign employee:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    router.push(`/leadSystem/leadmanage/${id}/${item._id}`);
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

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = contacts.map((item) => item._id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (isChecked: boolean, rowId: string) => {
    setSelectedRows((prevSelected) =>
      isChecked ? [...prevSelected, rowId] : prevSelected.filter((id) => id !== rowId)
    );
  };

  const openEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowEmployeeModal(true);
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchStudentLeadsByLeadsId(page, statusFilter, searchQuery);
    }
  };

  const handleDeleteItem = async () => {
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
      } finally {
        await fetchStudentLeadsByLeadsId(currentPage, searchQuery);
      }
    }
  };

  // --- Render ---

  if (loading && !searchQuery) {
    return <Loader />;
  }

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
      {/* Heading with Employee Information */}
      <div className="flex items-center justify-between px-4 mt-10">
        <div className="lg:text-3xl text-deepblue w-full mb-5">
          {employee ? `${employee}'s Leads` : "Leads Management"}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-4 overflow-x-auto px-4 py-2">
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
          const statusCount = totalStatus?.[status] || 0;
          const countToShow = status === "ALL" ? totalAllCount : statusCount;
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

      <div className="my-4 flex flex-nowrap items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-1 w-1/6 rounded-lg text-sm"
        />

        <div className="relative w-1/6">
          <select
            className="border border-gray-300 rounded-lg px-2 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none text-sm"
            value={assigned || ""}
            onChange={(e) => setAssigned(e.target.value)}
          >
            <option value="" label="Assigned/Unassigned" />
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {assigned && (
            <button
              onClick={() => setAssigned("")}
              className="absolute right-2 top-2 text-gray-500 hover:text-red-500 text-base"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative w-1/6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-2 pr-8 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {date && (
            <button
              onClick={() => setDate("")}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 text-lg"
              type="button"
            >
              ×
            </button>
          )}
        </div>

        <div className="relative w-1/6">
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

        <div className="relative w-1/6">
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
      </div>

      {/* Button Group for Actions */}
      <div className="flex space-x-4 items-center mb-5">
        <button
          className={`mx-4 py-2 px-4 rounded-lg ${
            selectedRows.length > 0 ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-300"
          }`}
          onClick={openEmployeeSelectModal}
        >
          Assign to Employee
        </button>
        <button
          className="mx-4 py-2 px-4 rounded-lg bg-purple-500 text-white hover:bg-purple-800"
          onClick={() => setDetailedView((prev) => !prev)}
        >
          {detailedView ? "Leads view" : "Employee detailed view"}
        </button>

        {detailedView && (
          <div className="relative w-1/6">
            <span className="text-sm">Called At Date</span>
            <input
              type="date"
              value={calledAtDate}
              onChange={(e) => setCalledAtDate(e.target.value)}
              className="px-2 py-2 pr-8 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {calledAtDate && (
              <button
                onClick={() => setCalledAtDate("")}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 text-lg"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      <div className="my-5">
        <Table
          data={contacts}
          //@ts-ignore
          columns={detailedView ? detailedColumns : columns}
          actions={renderActions}
          db={currentPage - 1}
          pagination="manual"
          checkboxEnabled={true}
          //@ts-ignore
          handleSelectAll={handleSelectAll} handleRowSelect={handleRowSelect} selectedRows={selectedRows}
          itemsPerPage={pageLimit}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageLimitChange={(limit: number) => {
          setPageLimit(limit);
          setCurrentPage(1);
        }}
        pageLimit={pageLimit}
      />

      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDeleteItem}
      />
      <EmployeeListModal
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        handleEmployee={handleEmployee}
      />
    </div>
  );
};

export default leadsPage;
