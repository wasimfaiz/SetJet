"use client";
import { useEffect, useState } from "react";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faEdit,
  faEye,
  faTrashCan,
  faEnvelopeCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
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

import { welcomeEmail } from "@/app/email/welcomeEmail";
import { courseLaunchTemplate } from "@/app/email/courseLaunchTemplate";
import { referralInvitationTemplate } from "@/app/email/referralInvitationTemplate";

import { newsletterOfferTemplate } from "@/app/email/newsletterOfferTemplate";
import { abandonedEnrollmentTemplate } from "@/app/email/abandonedEnrollmentTemplate";
import { reengagementTemplate } from "@/app/email/reengagementTemplate";
import { promotionalCampaignTemplate } from "@/app/email/promotionalCampaignTemplate";

const statuses = ["DONE", "PENDING", "PROGRESS"];

const options = [
  { value: "USER", label: "USERS" },
  { value: "ADMISSION", label: "ADMISSION ENQUIRIES" },
];

interface UserItem {
  _id: string;
  name: string;
  desc?: string;
  priority?: string;
  createdAt?: string;
  status?: string;
  phoneNumber?: string;
  email?: string;
  employee?: {
    id: string;
    name?: string;
  };
  remark?: any;
}

const UserPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { employeeId, employeeName, employeeEmail } = useEmployeeContext();
  const { role, resetPermissions, fetchPermissions, email } = usePermissions();

  // State Variables
  const [user, setUser] = useState<UserItem[]>([]);
  const [userName, setUserName] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");

  // ⭐ NEW: Marketing email modal states & bulk selection
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [selectedMarketingUser, setSelectedMarketingUser] = useState<any>(null); // used for single-send modal
  const [selectedTemplate, setSelectedTemplate] = useState("courseLaunch");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // bulk selection
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  useEffect(() => {
    fetchUser(1, "", selectedEmployee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  useEffect(() => {
    fetchUser(currentPage, "", selectedEmployee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLimit]);

  const fetchEmployees = async () => {
    setLoading(true); // Start loading state
    try {
      const response = await apiClient.get(`/api/employees`);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format");
      }

      const employeesData = response.data
        .map((employee: any) => {
          if (!employee.basicField?.email || !employee._id) {
            return null;
          }
          return {
            label: employee.basicField.email,
            value: employee._id,
          };
        })
        .filter(Boolean);

      setEmployees(employeesData);
    } catch (error: any) {
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
  const fetchUser = async (page = 1, search = "", empId = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/api/users?search=${encodeURIComponent(search)}&employeeId=${empId}&page=${page}&limit=${pageLimit}&status=${selectedStatus}`
      );
      setUser(response.data?.users || []);
      setTotalPages(response.data?.totalPages || 1);
    } catch (err) {
      setError("Failed to load user.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (item: any) => {
    try {
      setLoading(true);
      await apiClient.post("/api/email", {
        userId: item._id,
        subject: "Welcome to Our Platform!",
        html: welcomeEmail(item.name),
      });

      alert(`Email sent to: ${item.email}`);
    } catch (error) {
      console.error("Email sending failed:", error);
      alert("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  // Single / Individual marketing send (reuse same template logic)
  const sendMarketingEmail = async () => {
    if (!selectedMarketingUser) return;

    try {
      setLoading(true);
      const htmlTemplate = pickTemplateHtml(selectedTemplate, selectedMarketingUser.name);

      await apiClient.post("/api/email", {
        userId: selectedMarketingUser._id,
        subject: "Special Offer Just for You!",
        html: htmlTemplate,
      });

      alert(`Marketing email sent to: ${selectedMarketingUser.email}`);
      setShowMarketingModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to send marketing email");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ PICK TEMPLATE HELPER
  const pickTemplateHtml = (templateKey: string, name: string) => {
    switch (templateKey) {
      case "courseLaunch":
        return courseLaunchTemplate(name);
      case "referralInvite":
        return referralInvitationTemplate(name);
      case "newsletter":
        return newsletterOfferTemplate(name);
      case "abandonedCart":
        return abandonedEnrollmentTemplate(name);
      case "reengagement":
        return reengagementTemplate(name);
      case "promoCampaign":
        return promotionalCampaignTemplate(name);
      default:
        return newsletterOfferTemplate(name);
    }
  };

  // ---------- FIXED BULK SEND (fetch each user + parallel send using Promise.allSettled) ----------
  const sendBulkEmails = async (templateKey: string) => {
    if (!selectedUsers || selectedUsers.length === 0) {
      alert("Please select at least one user to send emails.");
      return;
    }

    try {
      setLoading(true);

      // Build an array of promises where each promise fetches the user by id then sends email
      const sendPromises = selectedUsers.map(async (userId) => {
        try {
          // fetch latest user data from API (ensures we have name & email even if paginated)
          const res = await apiClient.get(`/api/users?id=${encodeURIComponent(userId)}`);
          // The API might return the user object directly or inside data; adapt:
          const recip = res?.data?.user || res?.data || null;

          const name = recip?.name || "Student";
          const html = pickTemplateHtml(templateKey, name);

          // send the email request
          const sendRes = await apiClient.post("/api/email", {
            userId,
            subject: "Special Offer Just for You!",
            html,
          });

          return { userId, status: "fulfilled", result: sendRes?.data || null };
        } catch (err: any) {
          // return error information but don't throw — we'll handle later
          return { userId, status: "rejected", error: err?.message || err };
        }
      });

      // run all sends in parallel but capture per-item outcome
      const results = await Promise.all(sendPromises);

      const succeeded = results.filter((r: any) => r.status === "fulfilled");
      const failed = results.filter((r: any) => r.status === "rejected");

      // Report back
      alert(`Bulk send complete — succeeded: ${succeeded.length}, failed: ${failed.length}`);

      if (failed.length > 0) {
        console.error("Failed items:", failed);
        // Optionally show details to user, or provide a download — keep it simple:
        alert(`Failed to send to ${failed.length} user(s). Check console for details.`);
      }

      // Clear selection on success
      if (succeeded.length > 0) {
        setSelectedUsers([]);
        setShowBulkModal(false);
      }
    } catch (err) {
      console.error("Bulk send top-level error:", err);
      alert("Bulk send failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };
  // -----------------------------------------------------------------------------------------------

  // Checkbox handlers
  const toggleSelectUser = (id: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  const selectAllOnPage = () => {
    const idsOnPage = user.map((u) => u._id);
    setSelectedUsers(idsOnPage);
  };

  const clearAllSelection = () => {
    setSelectedUsers([]);
  };

  const isAllSelectedOnPage = () => {
    if (user.length === 0) return false;
    return user.every((u) => selectedUsers.includes(u._id));
  };

  const actions = (item: any) => (
    <div className="flex items-center gap-2">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selectedUsers.includes(item._id)}
        onChange={() => toggleSelectUser(item._id)}
        className="h-4 w-4"
        title="Select user for bulk email"
      />

      {/* Welcome Email */}
      <button
        className="h-5 w-5 text-blue-600"
        onClick={() => handleSendEmail(item)}
        title="Send welcome email"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>

      {/* Individual marketing email */}
      <button
        className="h-5 w-5 text-green-700"
        onClick={() => {
          setSelectedMarketingUser(item);
          setSelectedTemplate("courseLaunch");
          setShowMarketingModal(true);
        }}
        title="Send Marketing Email"
      >
        <FontAwesomeIcon icon={faEnvelopeCircleCheck} />
      </button>

      {checkButtonVisibility(permissions, "userAdmission", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
          title="Delete user"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </div>
  );

  // Fetch user by id
  const fetchUserId = async (id: any) => {
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

  const handleAddUser = async (name: string, desc: string, priority: string) => {
    try {
      setLoading(true);
      // @ts-ignore
      if (userName?._id) {
        // Update existing user
        // @ts-ignore
        await apiClient.put(`/api/users?id=${userName?._id}`, { name, desc, priority });
      } else {
        // Create new user
        await apiClient.post("/api/users", { name, desc, priority, status: "PENDING" });
      }

      // Refresh the user list after the operation
      fetchUser();
      setShowUserModal(false);
      setLoading(false);
    } catch (error) {
      console.error("Error saving user:", error);
      // @ts-ignore
      setError(`Failed to ${userName?._id ? "update" : "add"} user.`);
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      // @ts-ignore
      fetchUser(page, searchQuery, selectedEmployee);
    }
  };

  const handleNavigation = (tab: string) => {
    if (tab === "ADMISSION") {
      router.push("/leadSystem/admission");
    }
  };

  // Search debounce (keeps previous function but renamed to avoid conflict)
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeoutId = setTimeout(() => {
      // @ts-ignore
      fetchUser(1, query, selectedEmployee);
    }, 500);
    setDebounceTimeout(timeoutId);
  };

  // Modal and button helpers
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="userAdmission">
      <div className="container">
        {/* Header + Bulk Controls */}
        <div className="flex items-center justify-between px-4 mt-10">
          <h1 className="md:text-3xl text-lg text-deepblue">Users & Admission Enquiries</h1>

          <div className="flex items-center gap-3">
            {/* Select All / Clear */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelectedOnPage()}
                onChange={() => (isAllSelectedOnPage() ? clearAllSelection() : selectAllOnPage())}
                title="Select all users on page"
                className="h-4 w-4"
              />
              <span className="text-sm">Select All (this page)</span>
            </div>

            {/* ⭐ NEW: Bulk Template Dropdown */}
            <select
              className="border rounded-lg p-2"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="courseLaunch">Course Launch Announcement</option>
              <option value="referralInvite">Referral / Affiliate Invitation</option>
              <option value="newsletter">Newsletter / Offers</option>
              <option value="abandonedCart">Abandoned Cart / Enrollment</option>
              <option value="reengagement">Re-engagement (Inactive Users)</option>
              <option value="promoCampaign">Promotional Campaign (Festive Sales)</option>
            </select>

            {/* Bulk send button */}
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={selectedUsers.length === 0}
              className={`px-4 py-2 rounded-lg text-white ${selectedUsers.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-deepblue"}`}
              title={selectedUsers.length === 0 ? "Select users first" : "Send bulk emails"}
            >
              Send Bulk Emails ({selectedUsers.length})
            </button>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2">
          {options.map((location) => (
            <div
              key={location.value}
              onClick={() => handleNavigation(location.value)}
              className={`cursor-pointer px-1 py-1 md:px-2 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
                location.value === "USER"
                  ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white hover:bg-gradient-to-r hover:from-green-700 hover:to-parrotgreen"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <div className="flex items-center justify-start gap-1">
                <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
                  <FontAwesomeIcon icon={faDatabase} className="text-green-800 h-4 w-4" />
                </div>
                <div className="lg:text-xs text-[8px] font-semibold text-center">{location.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="my-4 flex gap-1 mx-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name"
            className="border p-2 w-full lg:w-1/2 rounded-lg"
          />
        </div>

        {/* Main Data Table */}
        <div className="my-5 px-2">
          <Table
            data={user}
            // @ts-ignore
            columns={columns}
            itemsPerPage={pageLimit}
            pagination="manual"
            actions={actions}
            handleView={handleView}
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

        {/* Delete Modal */}
        <DeleteModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onDelete={handleDelete} />

        {/* Individual Marketing Email Modal */}
        {showMarketingModal && selectedMarketingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[420px]">
              <h2 className="text-xl font-bold mb-4">Send Marketing Email</h2>

              <label className="font-semibold">Choose Template:</label>
              <select
                className="border rounded-lg p-2 w-full mt-2"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="courseLaunch">Course Launch Announcement</option>
                <option value="referralInvite">Referral / Affiliate Invitation</option>
                <option value="newsletter">Newsletter / Offers</option>
                <option value="abandonedCart">Abandoned Cart / Enrollment</option>
                <option value="reengagement">Re-engagement (Inactive Users)</option>
                <option value="promoCampaign">Promotional Campaigns (Black Friday etc.)</option>
              </select>

              <div className="flex justify-end mt-5 gap-3">
                <button className="px-4 py-2 bg-gray-400 rounded-lg" onClick={() => setShowMarketingModal(false)}>Cancel</button>
                <button className="px-4 py-2 bg-deepblue text-white rounded-lg" onClick={sendMarketingEmail}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Marketing Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[480px]">
              <h2 className="text-xl font-bold mb-4">Send Bulk Marketing Email</h2>

              <p className="text-sm text-gray-600 mb-3">Sending to <strong>{selectedUsers.length}</strong> user(s).</p>

              <label className="font-semibold">Selected Template:</label>
              <p className="mb-3"><strong>{selectedTemplate}</strong></p>

              <div className="flex justify-between items-center mt-5">
                <button className="px-4 py-2 bg-gray-400 rounded-lg" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button
                  className="px-4 py-2 bg-deepblue text-white rounded-lg"
                  onClick={() => sendBulkEmails(selectedTemplate)}
                >
                  Send to {selectedUsers.length} user(s)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
};

export default UserPage;
