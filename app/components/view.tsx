"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faDownload,
  faCheck,
  faTimes,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

interface Field {
  label: string;
  value: string;
  // added "fileArray" to your union
  type?: "text" | "number" | "file" | "select" | "boolean" 
      | "array" | "link" | "semester" | "invoice" | "lor" 
      | "lom" | "sop" | "fileArray" | "textarea" 
      | "dateTime" | "dateArray" | "objArray";
}

interface ViewProps {
  item: Record<string, any>;
  fields: Field[];
  handleEdit?: (item: any) => void;
  multiple?: string;
}

// Helper function to retrieve nested values
const getNestedObjectValue = (obj: any, path: string) => {
  if (!path || typeof path !== "string") return undefined;
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj
    );
};

const View: React.FC<ViewProps> = ({ item, fields, handleEdit }) => {
  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(
        fileUrl
      )}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const openPDF = (url: string) => {
    const pdfWindow = window.open(url, "_blank");
    if (!pdfWindow) console.error("Failed to open PDF window");
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes("-");
  };
  const formatDateTime = (dateTime: string) => {
    if (!isValidDate(dateTime)) return dateTime;
    const date = new Date(dateTime);
    return date.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex justify-end mb-6">
        {handleEdit && (
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={() => handleEdit(item)}
          >
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 grid-cols-1 gap-2 md:mb-6">
        {fields
          .filter(
            (f) =>
              f.type !== "file" &&
              f.type !== "lom" &&
              f.type !== "sop" &&
              f.type !== "lor" &&
              f.type !== "invoice"
          )
          .map((field, idx) => {
            const val = getNestedObjectValue(item, field.value);
            return (
              <div className="flex flex-col md:my-2" key={idx}>
                <label className="text-gray-400 md:font-medium font-[10px] md:my-2 my-1">
                  {field.label}
                </label>

                {field.type === "boolean" ? (
                  <p className="text-deepblue md:font-medium">
                    {val ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faTimes}
                        className="text-red-500"
                      />
                    )}
                  </p>
                ) : field.type === "array" ? (
                  <p className="text-deepblue md:font-medium font-xs">
                    {Array.isArray(val) ? val.join(", ") : "N/A"}
                  </p>
                 ) : field.type === "objArray" ? (
                  <div className="text-deepblue md:font-medium space-y-2">
                    {Array.isArray(val) && val.length > 0 ? (
                      val.map((reminder, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                        >
                          <p className="font-semibold">🔔 Reminders {idx + 1}</p>
                          <p>
                            <span className="font-semibold">Message:</span>{" "}
                            {reminder.message || reminder.remark || "N/A"}
                          </p>
                          {reminder.time && <p>
                            <span className="font-semibold">Time:</span>{" "}
                            🕒 {reminder.time ? reminder.time.replace("T", ", ") : "N/A"}
                          </p>}
                          {reminder?.reminder?.length > 0 && (
                            <p>
                              <span className="font-semibold">Reminders:</span>{" "}
                              🔔 {reminder.reminder.join(", ")}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No reminders available.</p>
                    )}
                  </div>
                ) : field.type === "fileArray" ? (
                  <div className="text-deepblue md:font-medium space-y-4">
                    {Array.isArray(val) && val.length > 0 ? (
                      val.map((url: string, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          {url.endsWith(".pdf") ? (
                            <img
                              src="/dummy.png"
                              alt="PDF"
                              className="h-12 w-12 object-cover"
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`img-${i}`}
                              className="h-12 w-12 object-cover"
                            />
                          )}
                          {/* <span className="flex-1 text-sm break-all">
                            {url.split("/").pop()}
                          </span> */}
                          <button
                            onClick={() => openPDF(url)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={() =>
                              handleDownload(url, field.label + `-${i + 1}`)
                            }
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">None</p>
                    )}
                  </div>
                ) : field.type === "link" ? (
                  <a
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline hover:text-blue-700"
                  >
                    {val || "Open Link"}
                  </a>
                ) : field.type === "dateTime" ? (
                  <p className="text-deepblue md:font-medium">
                    {val ? formatDateTime(val) : "N/A"}
                  </p>
                ) : field.type === "dateArray" ? (
                  <div className="text-deepblue md:font-medium">
                    {Array.isArray(val) &&
                      val.map((dt: string, i: number) => (
                        <p key={i}>{formatDateTime(dt)}</p>
                      ))}
                  </div>
                ) : field.type === "semester" ? (
                  <div className="text-deepblue md:font-medium">
                    {Object.keys(item)
                      .filter((k) => k.startsWith("semester"))
                      .map((semKey, si) => (
                        <p key={si} className="font-xs my-1">
                          <span className="font-semibold">
                            Semester {si + 1}:
                          </span>{" "}
                          {item[semKey] || "N/A"}
                        </p>
                      ))}
                  </div>
                ) : field.type === "textarea" ? (
                  <p className="text-deepblue md:font-medium font-xs whitespace-pre-wrap max-h-60 border border-gray-300 rounded-lg p-4">
                    {val || "N/A"}
                  </p>
                ) : (
                  <p className="text-deepblue md:font-medium font-[10px]">
                    {val ?? "N/A"}
                  </p>
                )}
              </div>
            );
          })}
      </div>

      <div className="grid md:grid-cols-3 grid-cols-1 gap-2 mt-6">
        {/* existing single-file fields */}
        {fields
          .filter((f) => f.type === "file")
          .map((f, idx) => {
            const url = getNestedObjectValue(item, f.value);
            if (!url) return null;
            return (
              <div className="flex flex-col my-2" key={idx}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  {f.label}
                </label>
                {url.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="/dummy.png"
                      alt="PDF"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(url)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(url, f.label)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={url}
                      alt={f.label}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(url)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(url, f.label)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default View;
