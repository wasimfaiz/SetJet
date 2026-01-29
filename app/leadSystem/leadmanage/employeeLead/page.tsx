"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";
import Table from "../../../components/table";
import DeleteModal from "../../../components/deletemodel";
import StatusTab from "../../../components/statusTab";
import InterestedClientsModal from "../../../components/interestedClientModal";
import Pagination from "../../../components/pagination";
import { checkButtonVisibility } from "../../../utils/helperFunc";
import { leadFields, leadsFieldEdit, statusTabs } from "../../../dummy/leads";
import { usePermissions } from "../../../contexts/permissionContext";
import { contactFields } from "@/app/dummy/database";
import apiClient from "@/app/utils/apiClient";

interface Counts {
  [key: string]: number;
}

interface Option {
  value: string;
  label: string;
}

const options: Option[] = [
  { value: "ALL LEADS", label: "ALL LEADS" },
  { value: "EMPLOYEE LEADS", label: "EMPLOYEE LEADS" },
  { value: "WALKING LEADS", label: "WALKING LEADS" },
];

const columns = [
  { header: "Employee Name", accessor: "employeeName", type: "text" },
];

const columnsModal = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Created at", accessor: "createdAt", type: "dateTime" },
  { header: "Assigned to", accessor: "to.name", type: "text" },
  { header: "Assigned at", accessor: "to.assignedAt", type: "dateTime" },
  { header: "Status", accessor: "status", type: "text" },
];

const LeadsPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  // Core states
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [counts, setCounts] = useState<Counts | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showInterestedClients, setShowInterestedClients] = useState<boolean>(false);
  const [interestedFollowClients, setInterestedFollowClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [initialData, setInitialData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Fetch leads group
  const fetchLeadsGroup = async () => {
    setError(null);
    try {
      const response = await apiClient.get(`/api/leads`);
      const data = response.data;
      const reversedData = Array.isArray(data) ? [...data].reverse() : [];
      setContacts(reversedData);
    } catch (err) {
      setError("Failed to load student leads.");
    }
  };

  // Fetch total by status and update interested clients
  const fetchTotalByStatus = async (page = 1, status: string, search: string) => {
    try {
      setLoading(true);
      let url = `/api/leads/student-leads/total?page=${page}&status=${status}&searchTerm=${search}&limit=${pageLimit}&category=GROUND`;
      const response: any = await apiClient.get(url);
      const { students, statusCounts, totalPages, totalCount } = response.data;
      setInterestedFollowClients(students);
      setTotalPages(totalPages);

      const mappedCounts: Counts = Object.entries(statusCounts).reduce(
        (acc: Counts, [key, count]) => {
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

  // Fetch detailed lead data for editing
  const fetchLeadData = async () => {
    if (selectedItem) {
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/leads/student-leads?id=${selectedItem._id}`);
        setInitialData(response.data);
      } catch (error) {
        console.error("Error fetching lead data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch clients by status for modal view
  const fetchClientsByStatus = async (status: string, searchTerm = "", page: number) => {
    try {
      const { data } = await apiClient.get(`/api/leads`);
      const databaseIds = data.database.map((db: any) => db._id);
      if (!databaseIds.length) {
        setInterestedFollowClients([]);
        return;
      }
      const payload = { databaseIds, status, searchTerm, page, limit: pageLimit };
      const clientResponse = await apiClient.post(`/api/leads/student-leads`, payload);
      setInterestedFollowClients(clientResponse.data.students || []);
    } catch (err) {
      console.error(`Error fetching ${status} clients:`, err);
      setError(`Failed to fetch ${status} clients.`);
    }
  };

  // Handlers
  const handleNavigation = (tab : string) =>{
    if (tab === "WALKING LEADS") router.push("/leadSystem/leadmanage/walkingLead");
    if (tab === "ALL LEADS") router.push("/leadSystem/leadmanage");
  }
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchTotalByStatus(currentPage, statusFilter, query);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/leads?id=${selectedItem._id}`);
        setContacts((prev) => prev.filter((contact) => contact._id !== selectedItem._id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting student data:", error);
        setError("Failed to delete student data.");
      } finally {
        await fetchLeadsGroup();
      }
    }
  };

  const handleInterestedClick = (status: string) => {
    setStatusFilter(status);
    fetchTotalByStatus(1, status, searchQuery);
    setShowInterestedClients(true);
  };

  const handleCloseInterestedClientsModal = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setIsEditing(false);
    setSelectedItem(null);
    setPageLimit(10);
    setShowInterestedClients(false);
  };

  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (selectedItem?._id) delete data._id;
      const now = new Date();
      const createdAt = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const response = await fetch(`/api/leads/student-leads?id=${selectedItem?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        alert("Data has been updated");
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleView = (item: any) => {
    router.push(`/leadSystem/leadmanage/${item?.employeeId}`);
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

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchTotalByStatus(page, statusFilter, searchQuery);
    }
  };

  // useEffects

  // On activeTab change, re-fetch totals after a 1s delay
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTotalByStatus(1, "", "");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // On mount, fetch leads and totals
  useEffect(() => {
    fetchLeadsGroup();
    fetchTotalByStatus(currentPage, statusFilter, searchQuery);
  }, []);

  // When selectedItem, currentPage, searchQuery, statusFilter or isEditing change, update lead details and modal clients
  useEffect(() => {
    fetchLeadData();
    fetchClientsByStatus(statusFilter, searchQuery, currentPage);
  }, [selectedItem, currentPage, searchQuery, statusFilter, isEditing]);

  // When searchQuery or statusFilter change, reset page and re-fetch totals
  useEffect(() => {
    setCurrentPage(1);
    fetchTotalByStatus(1, statusFilter, searchQuery);
  }, [searchQuery, statusFilter]);

  // When isEditing or showInterestedClients change, update totals
  useEffect(() => {
    fetchTotalByStatus(currentPage, statusFilter, searchQuery);
  }, [isEditing, showInterestedClients]);

  if (loading && !searchQuery) return <Loader />;

  return (
    <div className="container">
      {/* Heading */}
      <div className="flex items-center justify-between px-4 mt-10">
        <div className="lg:text-3xl text-deepblue w-full">Leads Management</div>
      </div>
      {/* Lead Type Tabs */}
      <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2">
        {options.map((location) => (
          <div
            key={location.value}
            onClick={() => handleNavigation(location.value)}
            className={`cursor-pointer px-1 py-1 md:px-2 md:py-2 rounded-lg shadow-sm transition-colors duration-200 ${
              location.value === "EMPLOYEE LEADS"
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
          <div className="flex gap-4 mt-5 mx-4 w-1/2">
            {statusTabs.map((tab) => (
              <StatusTab
                key={tab.status}
                label={`${tab.label} (${counts ? counts[tab.status] || 0 : 0})`}
                onClick={() => handleInterestedClick(tab.status)}
                bgColor={tab.bgColor}
                hoverColor={tab.hoverColor}
              />
            ))}
          </div>
          <div className="my-5 mx-2">
            <Table
              data={contacts}
              //@ts-ignore
              columns={columns}
              actions={renderActions}
              handleView={handleView}
            />
          </div>
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
          contactFields={leadFields}
          //@ts-ignore
          contactFieldsEdit={leadsFieldEdit}
          onSubmit={handleFormSubmit}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          pageLimit={pageLimit}
          columns={columnsModal}
        />
      )}
      <DeleteModal show={showModal} onClose={() => setShowModal(false)} onDelete={handleDelete} />
    </div>
  );
};

export default LeadsPage;
