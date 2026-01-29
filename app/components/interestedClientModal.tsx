import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit } from "@fortawesome/free-solid-svg-icons";
import View from "./view";
import AddEdit from "./addedit";
import Pagination from "./pagination";
import Table from "./table";

// Define types for props
interface InterestedClientsModalProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  data: any[];
  selectedItem: any | null;
  setSelectedItem: (item: any | null) => void;
  setCurrentPage: (item: any | null) => void;
  setPageLimit: (item: any | null) => void;
  isEditing: boolean;
  onEditToggle: (isEditing: boolean) => void;
  initialData: any;
  contactFields: { label: string; value: string }[];
  contactFieldsEdit: { label: string; value: string }[];
  onSubmit: (data: any) => void;
  onPageChange: (page: number) => void;
  onPageLimitChange?: (page: number) => void;
  currentPage: number;
  totalPages: number;
  pageLimit: number;
  columns?: any[]
}

const InterestedClientsModal: React.FC<InterestedClientsModalProps> = ({
  isVisible,
  onClose,
  searchQuery,
  onSearch,
  data,
  selectedItem,
  setSelectedItem,
  setCurrentPage,
  setPageLimit,
  isEditing,
  onEditToggle,
  initialData,
  contactFields,
  contactFieldsEdit,
  onSubmit,
  onPageChange,
  currentPage,
  totalPages,
  pageLimit,
  columns
}) => {
  if (!isVisible) return null;

  const columnsFields = [
    { header: "Name", accessor: "name", type: "text" },
    { header: "Mobile", accessor: "phoneNumber", type: "text" },
    { header: "Status", accessor: "status", type: "text" },
    { header: "Employee", accessor: "employee.name", type: "text" },
    { header: "Transferred to", accessor: "transferTo.name", type: "text" },
    { header: "Transferred From", accessor: "transferFrom.name", type: "text" },
  ];

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white w-full md:w-full max-w-5xl p-4 md:p-8 rounded-lg shadow-2xl h-auto m-1">
      {/* Header Section */}
      <div className="flex items-center justify-between px-2 md:px-4 mt-5">
        <h1 className="md:text-2xl text-xl text-deepblue">
          {selectedItem ? "View Student" : "Students Table"}
        </h1>
        <button
          onClick={() => {
            if (!selectedItem && !isEditing) {
              onClose(); // Go back to the table view
            } else if (selectedItem && !isEditing) {
              setSelectedItem(null); // Reset selectedItem to null
            } else {
              onEditToggle(false); // Close modal entirely when isEditing is true
            }
          }}
          className="text-bloodred hover:text-red-700 transition text-sm md:text-base"
        >
          {!selectedItem && !isEditing ? "Close" : "Back"}
        </button>
      </div>

      {!selectedItem && (
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name"
            className="border p-1 md:p-2 w-full md:w-1/2 rounded-lg text-xs md:text-sm mx-2"
          />
          <div className="h-[300px] md:h-[400px] overflow-y-auto my-3 mx-2">
            <Table
              data={data}
              //@ts-ignore
              columns={columns || columnsFields}
              actions={(item) => (
                <button
                  className="h-4 w-4 text-purple-500"
                  onClick={() => setSelectedItem(item)}
                >
                  <FontAwesomeIcon icon={faEye} className="text-xs md:text-sm" />
                </button>
              )}
              pagination="manual"
              itemsPerPage={pageLimit}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              onPageLimitChange={(limit) => {
                setPageLimit(limit);
                setCurrentPage(1); // Reset to first page when limit changes
              }}
              pageLimit={pageLimit}
            />
          </div>
        </div>
      )}

      {selectedItem && !isEditing && (
        <div className="px-2 md:px-4">
          <div className="w-full md:w-full max-w-5xl">
          <h3 className="text-lg md:text-xl font-semibold">
            Details for {initialData?.name}
          </h3>
          <div className="overflow-y-auto md:h-auto h-[300px]">
            <FontAwesomeIcon
              icon={faEdit}
              className="mt-4 bg-deepblue text-white px-3 py-1 md:px-4 md:py-2 rounded-lg float-right text-xs md:text-sm"
              onClick={() => onEditToggle(true)} // Toggle to AddEdit component
            />
            <View item={initialData} fields={contactFields} />
          </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="overflow-y-auto md:h-auto h-[300px]">
          <AddEdit
            //@ts-ignore
            fields={contactFieldsEdit}
            initialData={initialData}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </div>
  </div>
  );
};

export default InterestedClientsModal;
