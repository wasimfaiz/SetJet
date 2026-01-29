"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faHome } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import Pagination from "../../components/pagination";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import SearchableSelect from "../../components/searchableSelect";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "studentInfo.name" },
  { header: "Reg No.", accessor: "studentInfo.regNo" },
  { header: "RM", accessor: "studentInfo.rm" },
  { header: "Email", accessor: "studentInfo.email" },
  { header: "Contact", accessor: "studentInfo.contact" },
];

const options = [
  { value: "ABROAD", label: "ABROAD", link:"client/add" },
  { value: "INDIA", label: "INDIAN", link:"client/india/add" },
  { value: "VISA", label: "WORKING VISA", link:"client/visa/add" },
  { value: "COACHING", label: "COACHING CLASSES", link:"client/coaching/add" },
];

const ClientPageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [addpageNav, setAddpageNav] = useState<string>("");
  const { activeTab, changeTab } = usePersistentTab("ABROAD");

  const [selectedTab, setSelectedTab] = useState(activeTab || ''); // Local state for dropdown value
  const { currentPage, changePage } = usePersistentPage(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState()
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array

  const fetchContacts = useCallback(async (clientType:any, search:any, page= currentPage, limit= pageLimit) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (clientType) params.append('clientType', clientType);
      if (search) params.append('search', search);
      if (selectedEmployee) params.append('rm', selectedEmployee);
      const response = await apiClient.get(`/api/client?${params.toString()}&page=${page}&limit=${limit}`);
      const data = response.data?.clients;
      setTotalPages(response?.data?.totalPages)
      setClients(data);
    } catch (err) {
      setError("Failed to load clients.");
    } finally{
      setLoading(false);
    }
  }, [activeTab, currentPage, selectedEmployee]);
  useEffect(() => {
    fetchEmployees()
  },[])
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
    } catch (error: any) {
      console.error("Error fetching employees:", error.message);
      setError(error.message || "Failed to fetch employee list.");
    } finally {
      setLoading(false); // End loading state
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(activeTab, searchTerm, currentPage, pageLimit);
    }, 500);
      return () => clearTimeout(timer);
  }, [fetchContacts, pageLimit]);

  // Initialize the dropdown and navigation link based on activeTab
  useEffect(() => {
    const initialOption = options.find((option) => option.value === activeTab);
    if (initialOption) {
      setSelectedTab(activeTab); // Set the selected tab to the activeTab
      setAddpageNav(initialOption.link); // Set the initial navigation link
    }
  }, [activeTab, options]);

  // Handle dropdown change
  const handleDropdownChange = (e : any) => {
    const newValue = e.target.value;
    setSelectedTab(newValue); // Update selected tab
    const selectedOption = options.find((option) => option.value === newValue);
    setAddpageNav(selectedOption?.link || ''); // Update navigation link
  };

  // useEffect(() => {
  //   fetchContacts(activeTab, searchTerm);
  // }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchContacts(activeTab, term, 1);
    console.log("term", term);
    
  };
  const handleTabChange = (tab: string) => {
    changeTab(tab);
    changePage(1);
  };
  const handleView = (item: any) => {
    const lowerTab = activeTab.toLowerCase(); // Convert activeTab to lowercase
    if (lowerTab === "abroad")
      router.push(`/leadSystem/client/${item._id}`);
    else
      router.push(`/leadSystem/client/${lowerTab}/${item._id}`);
  };  
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/client?id=${selectedItem._id}`);
        setClients((prevContacts) =>
          prevContacts.filter((client) => client._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting client:", error);
        setError("Failed to delete client.");
      }
    }
  };
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      changePage(page);
      fetchContacts(activeTab, searchTerm, page);
    }
  }; 
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const renderActions = (item: any) => (
    <>
      {/* <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button> */}
      {checkButtonVisibility(permissions, "client", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading && !searchTerm) {
    return <Loader />;
  }

  return (
  <RouteGuard requiredPermission="client">
    <div className="container">
      {/* Header: Title + Dropdown + Add Button */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 px-4 mt-10">
        <div className="text-lg md:text-3xl text-deepblue">Clients</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end w-full md:w-auto gap-2">
          {checkButtonVisibility(permissions, "client", "add") && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* Dropdown with label */}
              <div className="flex items-center bg-gradient-to-r from-blue-900 to-deepblue text-white px-3 py-2 rounded-lg text-sm md:text-base transition duration-200">
                <select
                  className="bg-white text-black px-2 py-1 rounded-md text-sm md:text-base"
                  value={selectedTab}
                  onChange={handleDropdownChange}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="ml-2">Client</span>
              </div>

              {/* ADD Button */}
              <Link
                href={addpageNav || '#'}
                className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-3 py-2 rounded-lg text-sm md:text-base transition"
              >
                ADD
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="my-5 px-4">
        <input
          type="text"
          placeholder="Search by name, email, or contact"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full md:w-1/2 p-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-deepblue"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 md:gap-5 md:mt-10 mt-5 px-4">
        {options.map((location) => (
          <div
            key={location.value}
            onClick={() => handleTabChange(location.value)}
            className={`cursor-pointer px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-md transition-colors duration-200 text-xs md:text-sm ${
              activeTab === location.value
                ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full p-1">
                <FontAwesomeIcon icon={faHome} className="text-green-800 text-sm" />
              </div>
              <span className="font-semibold">{location.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mx-3 my-2">
        <div className="flex flex-col relative w-40">
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
      {/* Table */}
      <div className="my-10 px-2 md:px-4">
        <Table
          data={clients}
          columns={columns}
          actions={renderActions}
          handleView={handleView}
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

      {/* Delete Modal */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
    </div>
  </RouteGuard>
  );
};
const ClientPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPageContent />
    </Suspense>
  );
};
export default ClientPage;
