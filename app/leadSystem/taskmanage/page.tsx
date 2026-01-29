// TaskManagePage.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
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
import { usePersistentPage } from "../../hooks/usePersistentPage";
import usePersistentState from "../../hooks/usePersistentState";
import SearchableSelect from "../../components/searchableSelect";
import apiClient from "../../utils/apiClient";
import StatusModal from "@/app/components/statusModal";

const statuses = ["DONE", "PENDING", "PROGRESS"];

const TaskManagePageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { employeeId, employeeName, employeeEmail } = useEmployeeContext();

  // State
  const [taskManage, setTaskManage] = useState<any[]>([]);
  const [taskManageName, setTaskManageName] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskManageModal, setShowTaskManageModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  // Persisted filters using usePersistentState
  const [selectedEmployee, setSelectedEmployee] = usePersistentState(
    "task-filter-employee",
    ""
  );
  const [selectedStatus, setSelectedStatus] = usePersistentState(
    "task-filter-status",
    ""
  );

  const [searchQuery, setSearchQuery] = usePersistentState(
    "task-filter-search",
    ""
  );

  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  // Columns definition for <Table>
  const columns = [
    { header: "Task Name", accessor: "name", type: "text" },
    { header: "Assigned by", accessor: "by.employeeName", type: "text" },
    {
      header: "Assigned at",
      accessor: "employee.assignedAt",
      type: "dateTime",
    },
    { header: "Assigned to", accessor: "employee.name", type: "employee" },
    { header: "Status", accessor: "status", type: "status" },
    { header: "Priority", accessor: "priority", type: "priority" },
    { header: "Remark", accessor: "remark", type: "remark" },
  ];

  // Fetch list on mount & filters (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTaskManage(
        currentPage,
        searchQuery,
        selectedEmployee,
        selectedStatus
      );
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageLimit, selectedEmployee, searchQuery, selectedStatus]);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === API calls via apiClient ===

  async function fetchEmployees() {
    setLoading(true);
    try {
      const resp = await apiClient.get<any[]>("/api/employees");
      const list = (resp.data || []).map((e: any) => ({
        label: e.basicField.email,
        value: e._id,
      }));
      setEmployees(list.filter(Boolean));
    } catch (e: any) {
      setError(e.message || "Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaskManage(
    page = currentPage,
    search: string | undefined = undefined,
    empId: string | undefined = undefined,
    status: string | undefined = undefined
  ) {
    setLoading(true);
    setError(null);

    // If caller didn't pass a value, fall back to the current component state
    const q = search !== undefined ? search : searchQuery;
    const eId = empId !== undefined ? empId : selectedEmployee;
    const st = status !== undefined ? status : selectedStatus;

    try {
      const resp = await apiClient.get(
        `/api/tasks?search=${encodeURIComponent(
          q
        )}&employeeId=${eId}&page=${page}&limit=${pageLimit}&status=${st}`
      );
      setTaskManage(resp.data?.tasks || []);
      setTotalPages(resp.data?.totalPages || 1);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaskManageId(id: string) {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get(`/api/tasks?id=${id}`);
      setTaskManageName(resp.data);
    } catch {
      setError("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmployee(id: string, name: string) {
    if (!selectedItem) return;
    const now = new Date();
    const istOffset = 5.5 * 3600 * 1000;
    const assignedAt = new Date(now.getTime() + istOffset).toISOString();
    const payload = {
      ...selectedItem,
      employee: { id, name, assignedAt },
      by: { employeeName, employeeId, employeeEmail },
      notified: false,
    };
    try {
      await apiClient.put(`/api/tasks?id=${selectedItem._id}`, payload);
      fetchTaskManage();
      setShowEmployeeModal(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemark(remark: string[], remarkUpdatedAt?: string[]) {
    if (!selectedItem) return;
    const payload = { ...selectedItem, remark, remarkUpdatedAt };
    try {
      await apiClient.put(`/api/tasks?id=${selectedItem._id}`, payload);
      fetchTaskManage();
      setShowRemarkModal(false);
    } catch (e) {
      console.error(e);
    }
  }
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
          `/api/tasks?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchTaskManage();
          setShowStatusModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  async function handleDelete() {
    if (!selectedItem) return;
    try {
      await apiClient.delete(`/api/tasks?id=${selectedItem._id}`);
      setTaskManage((prev) => prev.filter((t) => t._id !== selectedItem._id));
      setShowDeleteModal(false);
      fetchTaskManage();
    } catch (e) {
      console.error(e);
      setError("Failed to delete task.");
    }
  }

  async function handleAddTaskManage(
    name: string,
    desc: string,
    priority: string,
    img: string
  ) {
    try {
      setLoading(true);
      if (taskManageName?._id) {
        await apiClient.put(`/api/tasks?id=${taskManageName._id}`, {
          name,
          desc,
          priority,
          img,
        });
      } else {
        await apiClient.post("/api/tasks", {
          name,
          desc,
          priority,
          status: "PENDING",
          img,
        });
      }
      fetchTaskManage();
      setShowTaskManageModal(false);
    } catch {
      setError(`Failed to ${taskManageName?._id ? "update" : "add"} task.`);
    } finally {
      setLoading(false);
    }
  }

  // Handlers & utils
  const handleView = (item: any) => {
    router.push(`/leadSystem/taskmanage/${item._id}`);
  };
  function handleEdit(item: any) {
    setShowTaskManageModal(true);
    fetchTaskManageId(item._id);
  }
  function handleSearch(query: string) {
    setSearchQuery(query);
    // keep current page consistent; the fetch effect will run due to searchQuery change
  }
  function handlePageChange(page: number) {
    if (page !== currentPage) changePage(page);
  }

  const handleOpenAddTaskModal = () => {
    setTaskManageName(null); // Reset the taskManageName state
    setShowTaskManageModal(true);
  };
  const openStatusModal = (item: any) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };

  // Clear handlers for filters
  const clearEmployeeFilter = () => {
    setSelectedEmployee("");
    changePage(1);
    fetchTaskManage(1, searchQuery, "", selectedStatus);
  };
  const clearStatusFilter = () => {
    setSelectedStatus("");
    changePage(1);
    fetchTaskManage(1, searchQuery, selectedEmployee, "");
  };
  const clearSearch = () => {
    setSearchQuery("");
    changePage(1);
    fetchTaskManage(1, "", selectedEmployee, selectedStatus);
  };

  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="taskmanage">
      <div className="container mx-auto px-2">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mt-5">
          <h1 className="md:text-2xl text-base text-deepblue">Task Manager</h1>
          {checkButtonVisibility(permissions, "taskmanage", "add") && (
            <button
              className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen ml-2 text-white rounded-lg text-xs md:text-sm lg:text-base px-4 py-1 md:px-6 md:py-2 lg:px-8 lg:py-3"
              onClick={handleOpenAddTaskModal}
            >
              + Add Task
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="my-2 flex gap-1 mx-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by task name, employee, email"
            className="border p-1 w-full lg:w-1/2 rounded-lg text-xs md:text-sm pr-8"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2 text-gray-500 hover:text-red-500 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mx-2 my-2 items-start">
          {/* Employee select with clear button */}
          <div className="w-40 relative">
            <SearchableSelect
              options={employees}
              value={selectedEmployee}
              onChange={(val: string) => {
                setSelectedEmployee(val);
                changePage(1);
              }}
              placeholder="Select Employee"
            />
            {selectedEmployee && (
              <button
                className="absolute right-1 top-3 text-gray-500 hover:text-red-500 text-xs"
                onClick={clearEmployeeFilter}
                aria-label="Clear employee filter"
                title="Clear employee filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status select with clear button */}
          <div className="w-40 relative">
            <select
              className="border rounded-lg px-2 py-1 mt-1 focus:ring focus:ring-deepblue focus:outline-none text-xs md:text-sm pr-8 w-full"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                changePage(1);
              }}
            >
              <option value="">Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {selectedStatus && (
              <button
                className="absolute right-5 top-3 text-gray-500 hover:text-red-500 text-xs"
                onClick={clearStatusFilter}
                aria-label="Clear status filter"
                title="Clear status filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="my-3 px-2">
          <Table
            data={taskManage}
            //@ts-ignore
            columns={columns}
            itemsPerPage={pageLimit}
            pagination="manual"
            db={currentPage - 1}
            onEmployeeSelect={(item) => {
              setSelectedItem(item);
              setShowEmployeeModal(true);
            }}
            onRemarkChangeClick={(item) => {
              setSelectedItem(item);
              setShowRemarkModal(true);
            }}
            onStatusChangeClick={openStatusModal}
            actions={(item) => (
              <div className="flex gap-2">
                <button onClick={() => handleView(item)}>
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {checkButtonVisibility(permissions, "taskmanage", "edit") && (
                  <button
                    className="text-purple-400"
                    onClick={() => handleEdit(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                )}
                {checkButtonVisibility(permissions, "taskmanage", "delete") && (
                  <button
                    className="text-bloodred"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDeleteModal(true);
                    }}
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
              changePage(1);
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
        <RemarkModal
          show={showRemarkModal}
          onClose={() => setShowRemarkModal(false)}
          onSave={handleRemark}
          initialDates={selectedItem?.remarkUpdatedAt}
          initialValues={selectedItem?.remark}
        />
        <StatusModal
          show={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          //@ts-ignore
          onStatusChange={handleStatus}
        />
        <TaskModal
          show={showTaskManageModal}
          onClose={() => setShowTaskManageModal(false)}
          //@ts-ignore
          onSave={handleAddTaskManage}
          name="Task"
          defaultValue={taskManageName?.name}
          defaultDesc={taskManageName?.desc}
          defaultPriority={taskManageName?.priority}
          defaultImg={taskManageName?.img}
        />
        <EmployeeListModal
          show={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          handleEmployee={handleEmployee}
        />
      </div>
    </RouteGuard>
  );
};

const TaskManagePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <TaskManagePageContent />
  </Suspense>
);

export default TaskManagePage;
