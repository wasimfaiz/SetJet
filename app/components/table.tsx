"use client";
import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

interface Item {
  [key: string]: any;
}

interface Column {
  header: string;
  accessor: string;
  type?:
    | "text"
    | "date"
    | "dateTime"
    | "status"
    | "transfer"
    | "course"
    | "remark"
    | "comment"
    | "link"
    | "priority"
    | "employee"
    | "employeeId"
    | "boolean"
    | "file";
  hideOnMobile?: boolean;
}

interface TableProps {
  data: Item[];
  columns: Column[];
  actions?: (item: Item) => React.ReactNode;
  onStatusChangeClick?: (item: Item) => void;
  onCourseChangeClick?: (item: Item) => void;
  onRemarkChangeClick?: (item: Item) => void;
  handleView?: (item: Item) => void;
  onEmployeeSelect?: (item: Item) => void;
  handleRowSelect?: (checked: boolean, id: string) => void;
  handleSelectAll?: (checked: boolean) => void;
  db?: number;
  pagination?: string;
  itemsPerPage?: number;
  checkboxEnabled?: boolean;
  selectedRows?: string[];
}

const getNestedValue = (item: any, accessor: string, type?: string): any => {
  const regex = /([^[.\]]+)|\[(\d+)\]/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(accessor)) !== null) {
    if (match[1]) tokens.push(match[1]);
    if (match[2]) tokens.push(match[2]);
  }
  return tokens.reduce((acc, key) => acc && acc[key], item) ?? "-";
};

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-red-500 text-white",
    CONVERTED: "bg-green-500 text-white",
    "PAYMENT MODE": "bg-green-800 text-white",
    DONE: "bg-green-500 text-white",
    PROGRESS: "bg-orange-400 text-white",
    INTERESTED: "bg-green-500 text-green-900",
    "NOT INTERESTED": "bg-red-500 text-red-900",
    DNP: "bg-orange-400 text-orange-900",
    "FOLLOW UP": "bg-red-200 text-red-800",
    "SWITCH OFF": "bg-blue-400 text-blue-900",
    "CALL DISCONNECTED": "bg-purple-400 text-purple-900",
    OTHERS: "bg-teal-400 text-teal-900",
  };
  return map[status] || "bg-gray-300 text-gray-700";
};

const getCourseClass = (course: string) => {
  const map: Record<string, string> = {
    BACHELORS: "bg-green-300 text-green-900",
    MASTERS: "bg-yellow-300 text-yellow-900",
    MBA: "bg-red-300 text-red-900",
    MBBS: "bg-blue-300 text-blue-900",
    MEDICAL: "bg-purple-300 text-purple-900",
    "SPOKEN ENGLISH": "bg-indigo-300 text-indigo-900",
    "IELTS COURSE": "bg-pink-300 text-pink-900",
    "TESTAS COURSE": "bg-teal-300 text-teal-900",
    "GERMAN LANGUAGE COURSE": "bg-orange-300 text-orange-900",
    "WORKING VISA": "bg-red-200 text-red-800",
  };
  return map[course] || "bg-gray-300 text-gray-700";
};

const Table: React.FC<TableProps> = ({
  data,
  columns,
  actions,
  onStatusChangeClick,
  onCourseChangeClick,
  onRemarkChangeClick,
  handleView,
  onEmployeeSelect,
  handleRowSelect,
  handleSelectAll,
  db,
  pagination = "auto",
  itemsPerPage = 10,
  checkboxEnabled = false,
  selectedRows = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});

  // Fetch all employees once and build map
  useEffect(() => {
    apiClient
      .get<Array<{ _id: string | null; basicField: { name: string } }>>(
        "/api/employees"
      )
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : // @ts-ignore
            res.data.employees ?? [];

        const map: Record<string, string> = {};
        list
          // filter out any with null or empty id
          .filter(
            (emp: any) => typeof emp._id === "string" && emp._id.length > 0
          )
          .forEach((emp: any) => {
            map[emp._id!] = emp.basicField?.name ?? "";
          });

        setEmployeeMap(map);
      })
      .catch((err) => console.error("Failed to load employees:", err));
  }, []);

  const totalPages = Math.ceil(data?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = data?.slice(startIndex, startIndex + itemsPerPage);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleDownload = async (url: string, name: string) => {
    try {
      const resp = await fetch(
        `/api/download?url=${encodeURIComponent(
          url
        )}&filename=${encodeURIComponent(name)}`
      );
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error(e);
    }
  };

  const openPDF = (url: string) => {
    const win = window.open(url, "_blank");
    if (!win) console.error("Popup blocked");
  };

  // Render cell helper
  const renderCell = (item: Item, col: Column) => {
    const raw = getNestedValue(item, col.accessor, col.type);
    const display =
      col.type === "employeeId"
        ? employeeMap[raw as string] ?? (raw as string)
        : raw;

    switch (col.type) {
      case "status":
        return (
          <button
            className={`${getStatusClass(raw)} px-2 py-1 rounded`}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChangeClick?.(item);
            }}
          >
            {display === "-" ? "UPDATE" : display}
          </button>
        );
      case "transfer":
        return (
          <button
            className="px-2 py-1 bg-red-200 text-red-800 rounded"
            onClick={() => onEmployeeSelect?.(item)}
          >
            {display && display !== "-" ? display : "Transfer"}
          </button>
        );
      case "course":
        return (
          <button
            className={`${getCourseClass(raw)} px-2 py-1 rounded`}
            onClick={(e) => {
              e.stopPropagation();
              onCourseChangeClick?.(item);
            }}
          >
            {display === "-" ? "UPDATE" : display}
          </button>
        );
      case "employee":
        if (onEmployeeSelect) {
          return (
            <button
              className="px-2 py-1 bg-gradient-to-r from-green-500 to-green-700 rounded-md text-white text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onEmployeeSelect(item);
              }}
            >
              {display && display !== "-" && display.length > 2
                ? display
                : "Assign"}
            </button>
          );
        }
        return <span>{display}</span>;
      case "boolean":
        return (
          <span
            className={`px-2 py-1 rounded ${
              raw ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
            }`}
          >
            {raw ? "Yes" : "No"}
          </span>
        );
      case "remark":
      case "comment": {
        const arr = Array.isArray(raw) ? raw.filter(Boolean) : [];
        return arr?.length ? (
          <>
            <div>{arr[0]}</div>
            <button
              className="underline"
              onClick={(e) => {
                e.stopPropagation();
                onRemarkChangeClick?.(item);
              }}
            >
              {col.type === "remark" ? "Add/Edit Remark" : "Add/Edit Comment"}
            </button>
          </>
        ) : (
          <button
            className="underline"
            onClick={(e) => {
              e.stopPropagation();
              onRemarkChangeClick?.(item);
            }}
          >
            {col.type === "remark" ? "ADD REMARK" : "ADD COMMENT"}
          </button>
        );
      }
      case "link":
        return (
          <a href={display as string} target="_blank" rel="noopener noreferrer">
            {display}
          </a>
        );
      case "dateTime": {
        if (!display || typeof display !== "string") return <span>-</span>;
        // Remove milliseconds if present
        const cleaned = display.replace(/\.\d+Z$/, "Z");
        const date = new Date(cleaned);
        if (isNaN(date.getTime())) return <span>-</span>;
        const formatted = date.toLocaleString("en-GB", {
          timeZone: "UTC",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return <span>{formatted}</span>;
      }
      case "file":
        return (
          <FontAwesomeIcon
            icon={faEye}
            className="cursor-pointer"
            onClick={() => openPDF(display as string)}
          />
        );
      default:
        return <span>{display}</span>;
    }
  };

  return (
    <div className="mx-auto lg:p-2 overflow-x-auto">
      {data?.length === 0 ? (
        <div className="rounded-lg shadow-lg max-w-xl mx-auto">
          <img
            src="/nodata.jpg"
            alt="No Data"
            className="w-full h-92 object-contain"
          />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <table className="min-w-full bg-white border-collapse hidden sm:table">
            <thead className="bg-gradient-to-r from-blue-900 to-deepblue text-white">
              <tr>
                {checkboxEnabled && (
                  <th className="p-2">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll?.(e.target.checked)}
                      checked={
                        pageData?.length > 0 &&
                        selectedRows?.length === pageData.length
                      }
                    />
                  </th>
                )}
                <th className="p-2 text-sm">#</th>
                {columns?.map((col) => (
                  <th key={col.accessor} className="p-2 text-sm text-left">
                    {col.header}
                  </th>
                ))}
                {actions && <th className="z-10 relative p-2 text-sm"></th>}
              </tr>
            </thead>
            <tbody>
              {pageData?.map((item, idx) => (
                <tr
                  key={item._id || idx}
                  className={`${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } border-b cursor-pointer hover:bg-green-100 relative z-5`}
                  onClick={() => handleView?.(item)}
                >
                  {checkboxEnabled && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          handleRowSelect?.(e.target.checked, item._id)
                        }
                        checked={selectedRows.includes(item._id)}
                      />
                    </td>
                  )}
                  <td className="p-2 text-sm">
                    {db ? db * itemsPerPage + idx + 1 : startIndex + idx + 1}
                  </td>
                  {columns?.map((col) => (
                    <td
                      key={col.accessor}
                      className={`p-2 text-sm ${
                        col.hideOnMobile ? "hidden sm:table-cell" : ""
                      }`}
                    >
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="z-10 relative p-2 flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="sm:hidden">
            {pageData?.map((item, idx) => (
              <div
                key={item._id || idx}
                className="bg-white shadow-md rounded-lg p-4 mb-4 cursor-pointer"
                onClick={() => handleView?.(item)}
              >
                {checkboxEnabled && (
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        handleRowSelect?.(e.target.checked, item._id)
                      }
                      checked={selectedRows.includes(item._id)}
                    />
                    <span className="ml-2 font-semibold">
                      #{db ? db * itemsPerPage + idx + 1 : startIndex + idx + 1}
                    </span>
                  </div>
                )}
                {columns?.map((col) => {
                  const raw = getNestedValue(item, col.accessor, col.type);
                  const display =
                    col.type === "employeeId"
                      ? employeeMap[raw as string] ?? (raw as string)
                      : raw;
                  if (col.hideOnMobile) return null;
                  return (
                    <div key={col.accessor} className="mb-2">
                      <span className="font-semibold">{col.header}:</span>{" "}
                      {renderCell(item, col)}
                    </div>
                  );
                })}
                {actions && (
                  <div
                    className="z-10 relative mt-2 flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(item)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination !== "manual" && totalPages > 1 && (
            <div className="flex justify-between p-4">
              <button
                onClick={goPrev}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Previous
              </button>
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={goNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Table;