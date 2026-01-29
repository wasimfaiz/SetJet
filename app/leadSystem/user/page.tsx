"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import EmployeeListModal from "../../components/employeeModal";
import Loader from "../../components/loader";
import TaskModal from "../../components/createTaskModal";
import RemarkModal from "../../components/remarkModal";
import { useEmployeeContext } from "../../contexts/employeeContext";
import Pagination from "../../components/pagination";
import apiClient from "../../utils/apiClient";

const statuses = [
  "DONE",
  "PENDING",
  "PROGRESS"
];

interface UserItem {
  _id: string;
  name: string;
  desc: string;
  priority: string;
  createdAt: string;
  status: string;
  employee?: {
    id: string;
    name?: string;
  };
  remark: any;
}

const UserPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { employeeId, employeeName, employeeEmail } = useEmployeeContext();
  const { role, resetPermissions, fetchPermissions, email } = usePermissions();

  // State Variables
  const [user, setUser] = useState<UserItem[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState()
  const [searchQuery, setSearchQuery] = useState("");
  
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    fetchUser()
    // fetchEmployeeId()
    fetchEmployees();
  }, []);
  useEffect(() => {
    fetchUser()
  }, [selectedStatus]);
  useEffect(() => {
    fetchUser(1, "", selectedEmployee)
  }, [selectedEmployee]);
  useEffect(() => {
    fetchUser(currentPage, "", selectedEmployee)
  }, [pageLimit]);

  const fetchEmployees = async () => {
    setLoading(true); // Start loading state
    try {
      // Fetch employees from the API
      const response = await apiClient.get(`/api/employees`);
  
      // Validate the response data structure
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format");
      }
  
      // Map employee data into label-value pairs for the dropdown
      const employeesData = response.data.map((employee: any) => {
        if (!employee.basicField?.email || !employee._id) {
          console.warn("Skipping employee with missing data:", employee);
          return null;
        }
        return {
          label: employee.basicField.email,
          value: employee._id,
        };
      }).filter(Boolean); // Remove null entries
  
      setEmployees(employeesData); // Update state with processed employees
      console.log(employeesData);
      
    } catch (error: any) {
      console.error("Error fetching employees:", error.message);
      setError(error.message || "Failed to fetch employee list.");
    } finally {
      setLoading(false); // End loading state
    }
  };
  
  const columns = [
    { header: "Name", accessor: "name", type: "text" },
    { header: "Mobile", accessor: "phoneNumber", type: "text" },
    { header: "Email", accessor: "email", type: "text" },
  ];
  // Fetch user
  const fetchUser = async (page=1, search = "", empId="") => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/users?search=${search}&employeeId=${empId}&page=${page}&limit=${pageLimit}&status=${selectedStatus}`);
      setUser(response.data?.users);
      setTotalPages(response.data?.totalPages)
    } catch (err) {
      setError("Failed to load user.");
    } finally {
      setLoading(false);
    }
  };
  // Fetch user by id
  const fetchUserId = async (id:any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/users?id=${id}`);
        setUserName(response.data);
      } catch (err) {
        setError("Failed to load user.");
      } finally {
        setLoading(false);
      }
  };

 // Handle actions
  const handleView = (item: any) => router.push(`/leadSystem/user/${item._id}`);

const handleSendEmail = async (item: any) => {
  try {
    setLoading(true);
    await apiClient.get(`/api/users/send-email?id=${item._id}`);

    alert(`Email sent to: ${item.email}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    alert("Failed to send email");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/users?id=${selectedItem._id}`);
        setUser((prev) => prev.filter((db) => db._id !== selectedItem._id));
        setShowDeleteModal(false);
        fetchUser();
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("Failed to delete user.");
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      //@ts-ignore
      fetchUser(page, searchQuery, selectedEmployee);
    }
  };  
  // Search debounce
  const handleSearch = (query: string) => {    
    setSearchQuery(query);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeoutId = setTimeout(() => {
    }, 500);
    setDebounceTimeout(timeoutId);
    //@ts-ignore
    fetchUser(1, query, selectedEmployee)
  };
  // Modal and button helpers
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Conditional rendering
  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="user">
      <div className="container">
        {/* Header Section */}
        <div className="flex items-center justify-between px-4 mt-10">
          <h1 className="md:text-3xl text-lg text-deepblue">Users</h1>
          {/* {checkButtonVisibility(permissions, "usermanage", "add") && (
            <button
              className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen ml-4 text-white px-6 py-2 rounded-lg"
              onClick={() => setShowUserModal(true)}
            >
              + Add User
            </button>
          )} */}
        </div>
        <div className="my-4 flex gap-1 mx-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)} 
          placeholder="Search by name"
          className="border p-2 w-full lg:w-1/2 rounded-lg"
        />
        </div>
        {/* Main Data Table */}
        <div className="my-5 px-2">
          <Table
            data={user}
            //@ts-ignore
            columns={columns}
            itemsPerPage={pageLimit}
            pagination="manual"
            actions={(item) => (
              <div className="flex gap-2">
                <button className="h-5 w-5" onClick={() => handleView(item)}>
                  <FontAwesomeIcon icon={faEye} />
                </button>

{/* SEND EMAIL BUTTON */}
  <button
    className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
    onClick={() => handleSendEmail(item)}
  >
    Send Email
  </button>

                {checkButtonVisibility(permissions, "user", "delete") && (
                  <button
                    className="h-5 w-5 text-bloodred"
                    onClick={() => openDeleteModal(item)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                )}
              </div>
            )}
          />
          <Pagination
            currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageLimitChange={(limit) => {
                setPageLimit(limit);
                setCurrentPage(1); // Reset to first page when limit changes
              }}
              pageLimit={pageLimit}
            />
        </div>
        {/* Modals */}
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>

  );
};
export default UserPage;