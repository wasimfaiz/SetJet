"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Table from "../../components/table";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTrashCan,
  faStore,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import CallModal from "../../components/callModal";
import RemarkModal from "../../components/remarkModal";
import CourseModal from "../../components/courseModal";
import DbStatusModal from "../../components/dbStatusModal";
import Loader from "../../components/loader";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import Pagination from "../../components/pagination";
import { useEmployeeContext } from "../../contexts/employeeContext";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Enquired At", accessor: "createdAt", type: "dateTime" },
  {
    header: "Called at",
    accessor: "calledAt[0]",
    type: "dateTime",
  },
  { header: "Status", accessor: "action", type: "status" },
  {
    header: "Status Updated By",
    accessor: "statusUpdatedBy.employeeName",
    type: "text",
  },
  { header: "Looking for", accessor: "course", type: "course" },
  { header: "Remark", accessor: "remark", type: "remark" },
];
const options = [
  { value: "FREE COUNSELLING", label: "FREE COUNSELLING", url: "contact" },
  // { value: "EXPERT", label: "TALK TO EXPERT", url: "checkout" },
  { value: "MBA", label: "MBA", url: "contact" },
  { value: "CONTACT", label: "CONTACT US", url: "contact" },
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
  "TOTAL CALLS",
];
const EnquiryPageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const { employeeId, employeeName } = useEmployeeContext();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);

  const [filterDate, setFilterDate] = useState<string>("");

  const { activeTab, changeTab } = usePersistentTab("FREE COUNSELLING");

  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalAllCount, setTotalAllCount] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [totalStatus, setTotalStatus] = useState<any>([]);
  const [pageLimit, setPageLimit] = useState(10);

  function getUrlByValue(value: string): string | undefined {
    const option = options.find((opt) => opt.value === value);
    return option?.url;
  }
  const fetchEnquiries = async (page = currentPage, status = statusFilter) => {
    setLoading(true);
    setError(null);
    const activeurl = getUrlByValue(activeTab);
    try {
      // Build the API URL based on the tab
      let url = `/api/${activeurl}?page=${page}&status=${status}&limit=${pageLimit}`;
      if (activeurl === "contact") {
        url += `&flag=${activeTab}`;
      }

      // Fetch data from the API
      const response = await apiClient.get(url);
      let data = response.data?.contacts || [];
      const totalPages = response?.data?.totalPages || 0;

      // Filter data for "contact" tab
      if (activeurl === "contact") {
        data = data.filter((enquiry: any) => enquiry.flag === activeTab);
      }

      // Update state variables
      setEnquiries(data);
      setTotalPages(totalPages);
      setTotalStatus(response?.data?.statusCounts);
      setTotalAllCount(response?.data?.totalStatusCount);
    } catch (err) {
      console.error("Error fetching enquiries:", err);
      setError("Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnquiries(currentPage);
    }, 500); // Delay of 500 milliseconds
    return () => clearTimeout(timer);
  }, [activeTab, currentPage, pageLimit]);

  useEffect(() => {
    if (filterDate) {
      const filtered = enquiries?.filter((enquiry) => {
        const enquiryDate = new Date(enquiry?.createdAt)
          .toISOString()
          .split("T")[0];
        console.log(enquiryDate, enquiry?.createdAt);
        return enquiryDate === filterDate;
      });
      setFilteredEnquiries(filtered);
    } else {
      setFilteredEnquiries(enquiries);
    }
  }, [filterDate, enquiries]);
  const handleView = (item: any) => {
    const url = getUrlByValue(activeTab);
    router.push(`/leadSystem/${url}/${item._id}`);
  };
  const handleDelete = async () => {
    if (selectedItem) {
      const url = getUrlByValue(activeTab);
      try {
        await apiClient.delete(`/api/${url}?id=${selectedItem._id}`);
        setEnquiries((prevEnquiries) =>
          prevEnquiries.filter((enquiry) => enquiry._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting enquiry:", error);
        setError("Failed to delete enquiry.");
      } finally {
        await fetchEnquiries(currentPage);
      }
    }
  };
  const handleStatus = async (status: string) => {
    if (selectedItem) {
      const payload = {
        ...selectedItem,
        action: status,
        statusUpdatedBy: { employeeName: employeeName, employeeId: employeeId },
      };
      const url = getUrlByValue(activeTab);
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchEnquiries(currentPage);
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
      const url = getUrlByValue(activeTab);
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchEnquiries(currentPage);
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
        ? [istDate.toISOString(), ...selectedItem.calledAt]
        : [istDate.toISOString()];
      const payload = {
        ...selectedItem,
        calledAt: updatedCalledAt,
      };
      const url = getUrlByValue(activeTab);
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        const phoneNumber = selectedItem.phoneNumber;
        console.log("Dialing:", phoneNumber);
        window.open(`tel:${phoneNumber}`);
        if (response.status === 200) {
          fetchEnquiries(currentPage);
          setShowStatusModal(false);
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
        remarkUpdatedAt: remarkUpdatedAt,
      };
      const url = getUrlByValue(activeTab);
      try {
        const response = await apiClient.put(
          `/api/${url}?id=${selectedItem._id}`,
          payload
        );
        if (response.status === 200) {
          fetchEnquiries(currentPage);
          setShowRemarkModal(false);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    changePage(1);
    fetchEnquiries(currentPage, status);
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchEnquiries(page);
    }
  };
  const handleTabChange = (tab: string) => {
    changePage(1);
    changeTab(tab);
    setPageLimit(10);
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const openRemarkModal = (item: any) => {
    setSelectedItem(item);
    setShowRemarkModal(true);
  };
  const openStatusModal = (item: any) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };
  const openCallModal = (item: any) => {
    setSelectedItem(item);
    setShowCallModal(true);
  };
  const openCourseModal = (item: any) => {
    setSelectedItem(item);
    setShowCourseModal(true);
  };
  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => openCallModal(item)}>
        <FontAwesomeIcon icon={faPhone} />
      </button>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      {checkButtonVisibility(permissions, "enquiry", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={(e) => {
            e.stopPropagation();
            openDeleteModal(item);
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <RouteGuard requiredPermission="enquiry">
      <div className="container">
        {/* Heading */}
        <div className="flex items-center justify-between px-2 mt-6 md:px-4 md:mt-10">
          <div className="text-sm md:text-3xl text-deepblue">Enquiries</div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-2 mt-3 px-2 scrollbar-hide my-4">
          {options.map((tab) => (
            <div
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex-shrink-0 px-3 py-1 text-xs md:text-sm rounded-lg cursor-pointer ${
                activeTab === tab.value
                  ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <div className="flex gap-2 items-center">
                <div className="border border-white rounded-full p-1">
                  <FontAwesomeIcon icon={faStore} className="text-xs" />
                </div>
                <div>{tab.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2 overflow-x-auto px-2 py-2">
          {statusOptions.map((status) => {
            let statusColor = "bg-gray-300";
            if (status === "ALL") statusColor = "bg-yellow-500";
            if (status === "CONVERTED")
              statusColor = "bg-parrotgreen text-deepblue";
            if (status === "PAYMENT MODE")
              statusColor = "bg-green-800 text-green-900";
            if (status === "INTERESTED")
              statusColor = "bg-green-500 text-green-900";
            if (status === "NOT INTERESTED")
              statusColor = "bg-red-500 text-red-900";
            if (status === "DNP") statusColor = "bg-orange-600 text-orange-900";
            if (status === "FOLLOW UP")
              statusColor = "bg-red-400 text-deepblue";
            if (status === "SWITCH OFF")
              statusColor = "bg-blue-400 text-deepblue";
            if (status === "CALL DISCONNECTED")
              statusColor = "bg-purple-400 text-purple-700";
            if (status === "OTHERS") statusColor = "bg-teal-500 text-teal-800";
            if (status === "TOTAL CALLS")
              statusColor = "bg-green-900 text-white";
            //@ts-ignore
            const filteredItem = totalStatus?.find(
              (item: any) => item.status === status
            );
            const countToShow =
              status === "ALL" ? totalAllCount : filteredItem?.count || 0;

            return (
              <button
                key={status}
                className={`px-2 py-1 text-xs rounded-lg ${statusColor} ${
                  statusFilter === status
                    ? "ring-2 ring-offset-1 ring-deepblue"
                    : ""
                }`}
                onClick={() => handleStatusFilter(status)}
              >
                {status} ({countToShow})
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="my-4 px-2">
          <Table
            data={filteredEnquiries}
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            onStatusChangeClick={openStatusModal}
            onRemarkChangeClick={openRemarkModal}
            onCourseChangeClick={openCourseModal}
            db={currentPage - 1}
            pagination="manual"
            itemsPerPage={pageLimit}
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
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
        <CallModal
          show={showCallModal}
          onClose={() => setShowCallModal(false)}
          onCall={handleCalling}
          contact={selectedItem}
        />
        <RemarkModal
          show={showRemarkModal}
          onClose={() => setShowRemarkModal(false)}
          onSave={handleRemark}
          initialDates={selectedItem?.remarkUpdatedAt}
          initialValues={selectedItem?.remark}
        />
        <CourseModal
          show={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onCourseChange={handleCourse}
        />
        <DbStatusModal
          show={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusChange={handleStatus}
        />
      </div>
    </RouteGuard>
  );
};
const EnquiryPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnquiryPageContent />
    </Suspense>
  );
};
export default EnquiryPage;
