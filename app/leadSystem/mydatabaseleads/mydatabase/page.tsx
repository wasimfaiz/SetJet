"use client";

import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Table from "../../../components/table";
import { useRouter } from "next/navigation";
import { useEmployeeContext } from "../../../contexts/employeeContext";
import Loader from "../../../components/loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faEye } from "@fortawesome/free-solid-svg-icons";
import InterestedClientsModal from "../../../components/interestedClientModal";
import { contactFields, statusTabs } from "../../../dummy/database";
import Pagination from "../../../components/pagination";
import { usePersistentPage } from "@/app/hooks/usePersistentPage";
import StatusTab from "@/app/components/statusTab";
import apiClient from "@/app/utils/apiClient";

interface DatabaseItem {
  _id: string;
  name: string;
  createdAt: string;
  employee?: {
    id: string;
  };
}

const options = [
  { value: "LEADS", label: "ALL LEADS" },
  { value: "DATABASE LEADS", label: "DATABASE" },
  { value: "B2B", label: "B2B LEADS" },
];

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Created At", accessor: "createdAt", type: "dateTime" },
  { header: "Assigned At", accessor: "employee.assignedAt", type: "dateTime" },
];

const DatabaseContentPage = () => {
  const router = useRouter();
  const { employeeId, employeeName } = useEmployeeContext();
  const [database, setDatabase] = useState<DatabaseItem[]>([]);
  const [clientsByStatus, setClientsByStatus] = useState({
    INTERESTED: { clients: [], total: 0 },
    "FOLLOW UP": { clients: [], total: 0 },
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showClientsModal, setShowClientsModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ activeTab, setActiveTab ] = useState("DATABASE LEADS");
    
  const [isEditing, setIsEditing] = useState(false)
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array
  const [initialData, setInitialData] = useState(null);
  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setPageLimit] = useState(10);

  const contactFieldsEdit = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "Email",
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "text",
      placeholder: "Mobile",
    },
    {
      label: "State",
      name: "state",
      type: "text",
      placeholder: "State",
    },
    {
      label: "Status",
      name: "status",
      type: "select",
      options: [
        { label : "CONVERTED", value: "CONVERTED"},
        { label: "PAYMENT MODE", value: "PAYMENT MODE"},
        { label: "INTERESTED", value: "INTERESTED" },
        { label: "NOT INTERESTED", value: "NOT INTERESTED" },
        { label: "DNP", value: "DNP" },
        { label: "FOLLOW UP", value: "FOLLOW UP" },
        { label: "SWITCH OFF", value: "SWITCH OFF" },
        { label: "CALL DISCONNECTED", value: "CALL DISCONNECTED" },
        { label: "OTHERS", value: "OTHERS" },
      ],
    },
    {
      label: "Looking for",
      name: "course",
      type: "select",
      options: [
        { label: "UG", value: "UG" },
        { label: "PG", value: "PG" },
      ],
    },
    {
      label: "Remark",
      name: "remark",
      type: "textarea",
      placeholder: "Remark",
    },
    {
      label: "Transfer to",
      name: "transferTo.id",
      type: "select",
      options: employees, // Ensure `employees` is an array
    },
  ];
  // Fetch all databases for the employee
    const fetchDatabase = async (page=1) => {
        setLoading(true);
        try {
        if (employeeId) {
            let url = `/api/database?employeeId=${employeeId}&page=${page}&limit=${limit}`;
            const response = await apiClient.get(url);
            setDatabase(response?.data?.database);
            setTotalPages(response?.data?.totalPages);
        }
        } catch (err) {
        console.error("Error fetching database:", err);
        setError("Failed to fetch database.");
        } finally {
        setLoading(false);
        }
    };
    // Fetch clients by status for detailed view modal
    const fetchClientsByStatus = async (status: string, searchTerm = "", page: number) => {
    try {
        if (!employeeId) return;
        // Fetch the databases for the given employeeId
        const databaseUrl = `/api/database?employeeId=${employeeId}`;
        const response = await apiClient.get(databaseUrl);
        // Map database IDs (fallback to an empty array if none found)
        const databaseIds: string[] = response.data?.database?.map((db: DatabaseItem) => db._id) || [];
        if (databaseIds.length === 0) {
        setClientsByStatus((prev) => ({
            ...prev,
            [status]: { clients: [], total: 0 },
        }));
        return;
        }
        // Construct the payload and call the client endpoint
        const clientUrl = `/api/database/student-database`;
        const payload = { databaseIds, status, searchTerm, page, limit: limit };
        const clientResponse = await apiClient.post(clientUrl, payload);
        const clients = clientResponse.data.students || [];
        setClientsByStatus((prev) => ({
        ...prev,
        [status]: {
            clients,
            total: clientResponse.data.totalCount,
            totalPages: clientResponse.data.totalPages,
        },
        }));
    } catch (err) {
        console.error(`Error fetching ${status} clients:`, err);
        setError(`Failed to fetch ${status} clients.`);
    }
    };
    const fetchContactData = async () => {
    if (selectedItem) {
      setLoading(true); // Set loading true when fetching contact data
      try {
        const response = await apiClient.get(`/api/database/student-database?id=${selectedItem?._id}`);
        setInitialData(response.data);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      } finally {
        setLoading(false); // Set loading to false after contact data is fetched
      }
    }
  };
  useEffect(() => {
    fetchEmployees();
  }, []);
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/employees`);
      let employeesData = response.data || [];
      const segmentedData = employeesData.map((employee: any) => ({
        label: employee.basicField.name,
        value: employee._id,
      }));

      setEmployees(segmentedData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  // Unified click handler for statuses
  const handleStatusClick = (status: string) => {
    setStatusFilter(status);
    fetchClientsByStatus(status, searchQuery, currentPage);
    setShowClientsModal(true);
  };

  const handleCloseModal = () => {
    setShowClientsModal(false);
    setTotalPages(1);
    changePage(1);
    setPageLimit(10);
    setSearchQuery("");
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchClientsByStatus(statusFilter, query, currentPage);
  };
  const handleView = (item: any) => {
    console.log(item);
    changePage(1)
    if(item.type === "SHARED")
      router.push(`/leadSystem/mydatabaseleads/mydatabase/shared/${item._id}`);
    else
      router.push(`/leadSystem/mydatabaseleads/mydatabase/${item._id}`);
  };
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (selectedItem?._id) {
        delete data._id;
      }
      // Check if transferTo.id exists in the data
      if (data.transferTo?.id) {
        try {
          // Fetch employee details using transferTo.id
          const employeeResponse = await fetch(`/api/employees?id=${data.transferTo.id}`);
          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            // Update transferTo.name with the employee's name
            data.transferTo.name = employeeData?.basicField?.name;
            fetchContactData()
          } else {
            console.error("Error fetching employee details:", await employeeResponse.json());
            return; // Stop submission if fetching employee fails
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
          return; // Stop submission if there's an error
        }
      }

      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);
      if(data.transferTo?.id)
        {
          data.transferFrom = {
            id: employeeId,
            //@ts-ignore
            name: employeeName,
          };
          data.transferAt = createdAt;
        }
      const payload = data;
      const method = "PUT";
      const url = `/api/database/student-database?id=${selectedItem?._id}`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const result = await response.json();
        alert("Data has been updated");
        setIsEditing(false)
        // setSelectedItem(null)
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  useEffect(() => { 
    fetchContactData();
    fetchClientsByStatus(statusFilter, searchQuery, currentPage)
  }, [!isEditing, selectedItem, limit, currentPage]);
  useEffect(() => {
    const timer = setTimeout(() => {
        if (employeeId) {
            fetchDatabase(currentPage);
        }
      }, 500);
      return () => clearTimeout(timer);
  }, [employeeId, activeTab, statusFilter, currentPage, limit, searchQuery]);

  useEffect(() => {
    fetchClientsByStatus("INTERESTED", searchQuery, currentPage);
    fetchClientsByStatus("FOLLOW UP", searchQuery, currentPage);
  }, []);

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchClientsByStatus(statusFilter, searchQuery, page);
    }
  };  
  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
    changePage(1)
    if (tab === "DATABASE") router.push("/leadSystem/mydatabase");
    else if (tab === "B2B")
      router.push("/leadSystem/mydatabaseleads/myb2b");
    else
      router.push("/leadSystem/mydatabaseleads")
  };
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
    </>
  );
  if (loading && !searchQuery) {
    return <Loader />;
  }
  return (
  <div className="container mx-auto p-2">
    <div className="flex items-center justify-between px-2 mt-5">
      <h1 className="md:text-2xl text-base text-deepblue w-full">
        My Database & Ground Leads
      </h1>
    </div>
    
    <div className="flex space-x-2 mt-4 px-2 md:gap-3 items-center">
      {options.map((location) => (
        <div
          key={location.value}
          onClick={() => handleNavigation(location.value)}
          className={`cursor-pointer px-1 py-1 md:px-2 md:pr-3 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
            activeTab === location.value
              ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white hover:bg-gradient-to-r hover:from-green-700 hover:to-parrotgreen"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          }`}
        >
          <div className="flex items-center justify-start gap-1">
            <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
              <FontAwesomeIcon
                icon={faDatabase}
                className="text-green-800 h-4 w-4"
              />
            </div>
            <div className="lg:text-xs text-[8px] font-semibold text-center">
              {location.label}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="flex gap-4 mt-5 mx-4 w-1/2">
    {["INTERESTED", "FOLLOW UP"].map((status) => (
        <div
          key={status}
          onClick={() => handleStatusClick(status)}
          className={`px-2 py-1 rounded-lg ${
            status === "INTERESTED"
              ? "bg-green-400 hover:bg-green-900"
              : status === "FOLLOW UP"
              ? "bg-red-400 hover:bg-red-500"
              : "bg-purple-400 hover:bg-purple-500"
          } text-white text-xs font-medium shadow-sm cursor-pointer`}
        > 
          {/* @ts-ignore */}
          Total {status} ({clientsByStatus[status]?.total || 0})
        </div>
      ))}
    </div>
    <div className="my-2 px-2">
      {/* @ts-ignore */}
      <Table
        data={database}
        //@ts-ignore 
        columns={columns}
        handleView={handleView}
        actions={renderActions}
        pagination="manual"
        itemsPerPage={limit}
        db={currentPage - 1}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageLimitChange={(limit) => {
          setPageLimit(limit); // Set the limit for DATABASE LEADS tab
          changePage(1); // Reset to first page for DATABASE LEADS
        }}
        pageLimit={limit}
      />
    </div>

    {showClientsModal && (
      <InterestedClientsModal
        isVisible={showClientsModal}
        onClose={handleCloseModal}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        //@ts-ignore
        data={clientsByStatus[statusFilter]?.clients}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        setPageLimit={setPageLimit}
        setCurrentPage={changePage}
        isEditing={isEditing}
        onEditToggle={setIsEditing}
        initialData={initialData}
        contactFields={contactFields}
        //@ts-ignore
        contactFieldsEdit={contactFieldsEdit}
        onSubmit={handleFormSubmit}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        //@ts-ignore
        totalPages={clientsByStatus[statusFilter]?.totalPages}
        pageLimit={limit}
      />
    )}
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