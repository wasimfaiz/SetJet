"use client";
import { useEffect, useState } from "react";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import DatabaseModal from "../../components/createdatabaseModal";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import EmployeeListModal from "../../components/employeeModal";
import Loader from "../../components/loader";
import {
  columns,
  contactFields,
  statusTabs,
  studentFields,
} from "../../dummy/database";
import StatusTab from "../../components/statusTab";
import InterestedClientsModal from "../../components/interestedClientModal";
import { useEmployeeContext } from "../../contexts/employeeContext";
import Pagination from "../../components/pagination";
import apiClient from "../../utils/apiClient";
import MultiEmployeeListModal from "@/app/components/multiEmployeeListModal";

interface DatabaseItem {
  _id: string;
  name: string;
  createdAt: string;
  employee?: {
    id: string;
    name?: string;
  };
}

const DatabasePage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { employeeId, employeeName } = useEmployeeContext();

  // State Variables
  const [databaseName, setDatabaseName] = useState("");
  const [filteredDatabase, setFilteredDatabase] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showMultiEmployeeModal, setShowMultiEmployeeModal] = useState(false);

  const [interestedFollowClients, setInterestedFollowClients] = useState<any[]>(
    []
  );
  const [showInterestedClients, setShowInterestedClients] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    interested: 0,
    followUp: 0,
    transfer: 0,
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array
  const [initialData, setInitialData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageDb, setCurrentPageDb] = useState(1);
  const [pageLimitDb, setPageLimitDb] = useState(10);
  const [totalPagesDb, setTotalPagesDb] = useState(1);

  useEffect(() => {
    fetchEmployees();
  }, []);
  const fetchEmployees = async () => {
    setLoading(true); // Set loading true when fetching employees
    try {
      const response = await apiClient.get(`/api/employees?status=ACTIVE`);
      let employeesData = response.data || [];

      // Map the data into { label, value } format
      const segmentedData = employeesData.map((employee: any) => ({
        label: employee.basicField.name,
        value: employee._id,
      }));

      setEmployees(segmentedData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false); // Set loading to false after employee data is fetched
    }
  };
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
        { label: "PAYMENT MODE", value: "PAYMENT MODE" },
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
  // Fetch database
  const fetchDatabase = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/database?page=${page}&limit=${pageLimitDb}`
      );
      setFilteredDatabase(response.data.database);
      setTotalPagesDb(response?.data?.totalPages);
    } catch (err) {
      setError("Failed to load database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase(currentPageDb);
  }, [pageLimitDb]);

  // Fetch database by id
  const fetchDatabaseId = async (id: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/database?id=${id}`);
      setDatabaseName(response.data);
    } catch (err) {
      setError("Failed to load database.");
    } finally {
      setLoading(false);
    }
  };
  // Fetch total students by status
  const fetchTotalByStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/database/student-database/total`
      );
      const { statusCounts, transferCount } = response.data;

      // Combine all counts into a single object
      const counts = {
        interested: statusCounts.INTERESTED || 0, // Default to 0 if no count
        followUp: statusCounts["FOLLOW UP"] || 0, // Default to 0 if no count
        transfer: transferCount || 0, // Transfer count from transfer logic
      };
      setCounts(counts); // Update a single state variable
      setLoading(false);
    } catch (err) {
      console.error("Error fetching total by status:", err);
      setError("Failed to fetch total by status.");
    }
  };
  //@ts-ignore
  const fetchInterestedFollowClients = async (
    page: number,
    status: string,
    searchTerm = ""
  ) => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/database/student-database/total?page=${page}&status=${status}&searchTerm=${searchTerm}&limit=${pageLimit}`
      );
      const { students } = response.data;
      setInterestedFollowClients(students || []);
      setTotalPages(response?.data?.totalPages);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching total by status:", err);
      setError("Failed to fetch total by status.");
    }
  };
  // Assign employee to a database item
  const handleEmployee = async (id: string, name: string, permissions: []) => {
    console.log(id, name, permissions);
    console.log(selectedItem);

    if (selectedItem) {
      const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000); // Convert to IST
      const payload = {
        ...selectedItem,
        employee: { id, name, permissions, assignedAt: istDate },
      };
      try {
        const response = await apiClient.put(
          `/api/database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchDatabase();
          setShowEmployeeModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleMultiEmployee = async (employeeArray: any[]) => {
    if (selectedItem) {
      const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000); // IST time

      // Add assignedAt to each employee
      const updatedEmployees = employeeArray.map((emp) => ({
        id: emp.id,
        name: emp.name,
        permissions: emp.permissions,
        assignedAt: istDate,
      }));

      const payload = {
        ...selectedItem,
        employee: updatedEmployees,
      };

      try {
        const response = await apiClient.put(
          `/api/database?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchDatabase();
          setShowEmployeeModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const fetchContactData = async () => {
    if (selectedItem) {
      setLoading(true); // Set loading true when fetching contact data
      try {
        const response = await apiClient.get(
          `/api/database/student-database?id=${selectedItem?._id}`
        );
        setInitialData(response.data);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      } finally {
        setLoading(false); // Set loading to false after contact data is fetched
      }
    }
  };
  useEffect(() => {
    fetchContactData();
    fetchInterestedFollowClients(currentPage, statusFilter, searchQuery);
  }, [!isEditing, selectedItem, pageLimit]);
  // Handle actions
  const handleView = (item: any) => {
    if (item.type === "SHARED")
      router.push(`/leadSystem/database/shared?id=${item._id}`);
    else router.push(`/leadSystem/database/${item._id}`);
  };
  const handleEdit = (item: any) => {
    fetchDatabaseId(item._id);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/database?id=${selectedItem._id}`);
        setShowDeleteModal(false);
        fetchDatabase();
      } catch (error) {
        console.error("Error deleting database:", error);
        setError("Failed to delete database.");
      }
    }
  };

  const handleAddDatabase = async (name: string, type: string) => {
    try {
      //@ts-ignore
      if (databaseName?._id) {
        // Update existing database
        //@ts-ignore
        await apiClient.put(`/api/database?id=${databaseName?._id}`, {
          name,
          type,
        });
      } else {
        // Create new database
        await apiClient.post("/api/database", { name, type });
      }

      // Refresh the database list after the operation
      fetchDatabase();
      setShowDatabaseModal(false);
    } catch (error) {
      console.error("Error saving database:", error);
      //@ts-ignore
      setError(`Failed to ${databaseName?._id ? "update" : "add"} database.`);
    }
  };
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      // Remove _id from data if updating an existing item
      if (selectedItem?._id) {
        delete data._id;
      }

      // If transferTo.id exists, fetch employee details and update transferTo.name
      if (data.transferTo?.id) {
        try {
          const employeeResponse = await fetch(
            `/api/employees??status=ACTIVE&id=${data.transferTo.id}`
          );
          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            data.transferTo.name = employeeData?.basicField?.name; // Update transferTo.name
            fetchContactData(); // Refresh contact data
          } else {
            const errorDetails = await employeeResponse.json();
            console.error("Error fetching employee details:", errorDetails);
            return; // Stop submission if fetching employee fails
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
          return; // Stop submission if there's an error
        }
      }

      // Set transfer timestamp in IST timezone
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);

      // Add transferFrom information using logged-in employee details
      if (data.transferTo?.id) {
        data.transferFrom = {
          id: employeeId,
          //@ts-ignore
          name: employeeName,
        };
        data.transferAt = createdAt;
      }

      // Prepare payload and send API request
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

      // Handle response
      if (response.ok) {
        const result = await response.json();
        alert("Data has been updated successfully.");
        setIsEditing(false); // Exit editing mode
        // Optionally clear selectedItem
        // setSelectedItem(null);
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  // Search debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeoutId = setTimeout(() => {}, 500);
    fetchInterestedFollowClients(1, statusFilter, query);
    setDebounceTimeout(timeoutId);
  };
  const handleSearchGlobal = (query: string) => {
    setSearchQuery(query);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeoutId = setTimeout(() => {}, 500);
    fetchInterestedFollowClients(1, "", query);
    setDebounceTimeout(timeoutId);
  };
  // Modal and button helpers
  const handleInterestedClick = (status: string) => {
    setStatusFilter(status);
    setShowInterestedClients(true);
    fetchInterestedFollowClients(currentPage, status, searchQuery);
  };
  const handleCloseInterestedClientsModal = () => {
    setSearchQuery(""); // Optionally reset search query if modal is closed
    setIsEditing(false);
    setSelectedItem(null);
    setShowInterestedClients(false);
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };
  const openEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowEmployeeModal(true);
  };
  const openMultiEmployeeSelectModal = (item: any) => {
    setSelectedItem(item);
    setShowMultiEmployeeModal(true);
  };
  // Lifecycle hooks
  useEffect(() => {
    fetchDatabase();
    fetchTotalByStatus();
  }, [isEditing]);
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchInterestedFollowClients(page, statusFilter, searchQuery);
    }
  };
  const handlePageChangeDb = (page: number) => {
    if (page !== currentPageDb) {
      setCurrentPageDb(page);
      fetchDatabase(page);
    }
  };
  // Conditional rendering
  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="database">
      <div className="container">
        {/* Header Section */}
        <div className="flex items-center justify-between px-2 mt-5">
          <h1 className="md:text-2xl text-base text-deepblue">
            Student Database
          </h1>
          {checkButtonVisibility(permissions, "database", "add") && (
            <button
              className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen ml-2 text-white rounded-lg text-xs md:text-sm lg:text-base px-4 py-1 md:px-6 md:py-2 lg:px-8 lg:py-3"
              onClick={() => setShowDatabaseModal(true)}
            >
              + Add Database
            </button>
          )}
        </div>
        <div className="my-3 px-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchGlobal(e.target.value)}
            placeholder="Search by name or mobile"
            className="border p-1 w-full md:w-1/2 rounded-lg text-xs md:text-sm"
          />
        </div>
        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 mx-2 w-full w-2/3 lg:w-1/2">
          {statusTabs.map((tab) => (
            <StatusTab
              key={tab.status}
              label={`${tab.label} (${
                counts[tab.countKey as keyof typeof counts] || 0
              })`}
              onClick={() => handleInterestedClick(tab.status)}
              bgColor={tab.bgColor}
              hoverColor={tab.hoverColor}
            />
          ))}
        </div>
        {/* Main Data Table */}
        {searchQuery?.length <= 0 ? (
          <div className="my-5">
            <Table
              data={filteredDatabase}
              //@ts-ignore
              columns={searchQuery.length > 0 ? studentFields : columns}
              actions={(item) => (
                <div className="relative z-10 flex gap-2">
                  {item?.type !== "SHARED" &&
                    checkButtonVisibility(permissions, "database", "edit") && (
                      <button
                        className="bg-parrotgreen rounded-lg p-2 z-10 shadow-lg relative hover:bg-deepblue hover:text-white"
                        onClick={() => openEmployeeSelectModal(item)}
                      >
                        {item?.employee?.name || "Assign"}
                      </button>
                    )}
                  {item?.type === "SHARED" && (
                    <button
                      className="bg-orange-500 rounded-lg p-2"
                      onClick={() => openMultiEmployeeSelectModal(item)}
                    >
                      {item?.employee ? "SHARED" : "Assign shared db"}
                    </button>
                  )}
                  <button className="h-5 w-5" onClick={() => handleView(item)}>
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  {checkButtonVisibility(permissions, "database", "edit") && (
                    <button
                      className="h-5 w-5 text-purple-400"
                      onClick={() => {
                        setShowDatabaseModal(true);
                        handleEdit(item);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                  {checkButtonVisibility(permissions, "database", "delete") && (
                    <button
                      className="h-5 w-5 text-bloodred"
                      onClick={() => openDeleteModal(item)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  )}
                </div>
              )}
              pagination="manual"
              itemsPerPage={pageLimitDb}
            />
            <Pagination
              currentPage={currentPageDb}
              totalPages={totalPagesDb}
              onPageChange={handlePageChangeDb}
              onPageLimitChange={(pageLimitDb) => {
                setPageLimitDb(pageLimitDb);
                setCurrentPageDb(1); // Reset to first page when limit changes
              }}
              pageLimit={pageLimitDb}
            />
          </div>
        ) : (
          <div className="my-5 px-2">
            <Table
              data={interestedFollowClients}
              //@ts-ignore
              columns={studentFields}
              onEmployeeSelect={openEmployeeSelectModal}
              actions={(item) => (
                <div className="flex gap-2">
                  <button className="h-5 w-5" onClick={() => handleView(item)}>
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  {checkButtonVisibility(permissions, "database", "edit") && (
                    <button
                      className="h-5 w-5 text-purple-400"
                      onClick={() => {
                        setShowDatabaseModal(true);
                        handleEdit(item);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                  {checkButtonVisibility(permissions, "database", "delete") && (
                    <button
                      className="h-5 w-5 text-bloodred"
                      onClick={() => openDeleteModal(item)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  )}
                </div>
              )}
              pagination="manual"
              itemsPerPage={pageLimit}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageLimitChange={(pageLimit) => {
                setPageLimit(pageLimit);
                setCurrentPage(1); // Reset to first page when limit changes
              }}
              pageLimit={pageLimit}
            />
          </div>
        )}
        {/* Interested Clients Modal */}
        {showInterestedClients && (
          <InterestedClientsModal
            isVisible={showInterestedClients}
            onClose={handleCloseInterestedClientsModal}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            data={interestedFollowClients}
            selectedItem={selectedItem}
            setCurrentPage={setCurrentPage}
            setPageLimit={setPageLimit}
            setSelectedItem={setSelectedItem}
            isEditing={isEditing}
            onEditToggle={setIsEditing}
            initialData={initialData}
            contactFields={contactFields}
            //@ts-ignore
            contactFieldsEdit={contactFieldsEdit}
            onSubmit={handleFormSubmit}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            pageLimit={pageLimit}
          />
        )}
        {/* Modals */}
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
        <DatabaseModal
          show={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
          onSave={handleAddDatabase}
          name="Database"
          //@ts-ignore
          defaultValue={databaseName?.name}
          // defaultType={datab}
        />
        <EmployeeListModal
          show={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          //@ts-ignore
          handleEmployee={handleEmployee}
        />
        <MultiEmployeeListModal
          show={showMultiEmployeeModal}
          onClose={() => setShowMultiEmployeeModal(false)}
          enablePermissions={true}
          selectedInitial={selectedItem?.employee}
          handleEmployees={(selected) => {
            handleMultiEmployee(selected);
          }}
        />
      </div>
    </RouteGuard>
  );
};
export default DatabasePage;
