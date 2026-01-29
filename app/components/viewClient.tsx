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
  type?: "text" | "number" | "file" | "select" | "boolean" | "array" | "link" | "semester" | "invoice" | "lor" | "lom" | "sop" ;
}

interface ViewProps {
  item: Record<string, any>;
  fields: Field[];
  handleEdit?: (item: any) => void;
  multiple?: string;
}

const getNestedObjectValue = (obj: any, path: string) => {
  if (!path || typeof path !== "string") return undefined;
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj
    );
};

const ViewClient: React.FC<ViewProps> = ({ item, fields, handleEdit, multiple }) => {

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
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
    if (!pdfWindow) {
      console.error("Failed to open PDF in a new window.");
    }
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
          (field) =>
            field.type !== "file" &&
            field.type !== "lom" &&
            field.type !== "sop" &&
            field.type !== "lor" &&
            field.type !== "invoice"
        )
        .map((field, index) => {
          const fieldValue = getNestedObjectValue(item, field.value);

      return (
        <div className="flex flex-col md:my-2" key={index}>
          <label className="text-gray-400 md:font-medium font-[10px] md:my-2 my-1">
            {field.label}
          </label>
          {field.type === "boolean" ? (
            <p className="text-deepblue md:font-medium">
              {fieldValue ? (
                <FontAwesomeIcon icon={faCheck} className="text-green-500" />
              ) : (
                <FontAwesomeIcon icon={faTimes} className="text-red-500" />
              )}
            </p>
          ) : field.type === "array" ? (
            <p className="text-deepblue md:font-medium font-xs">
              {Array.isArray(fieldValue) ? fieldValue.join(", ") : "N/A"}
            </p>
          ) : field.type === "link" ? (
            <a
              href={fieldValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-700"
            >
              {fieldValue || "Open Link"}
            </a>
          ) : field.type === "semester" ? (
            <div className="text-deepblue md:font-medium">
              {Object.keys(item)
                .filter((key) => key.startsWith("semester"))
                .map((semesterKey, semesterIndex) => (
                  <p key={semesterIndex} className="font-xs my-1">
                    <span className="font-semibold">
                      Semester {semesterIndex + 1}:
                    </span>
                    {item[semesterKey] || "N/A"}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-deepblue md:font-medium font-[10px]">
              {fieldValue || "N/A"}
            </p>
          )}
        </div>
      );
    })}
      </div>
    <div className="grid md:grid-cols-3 grid-cols-1 gap-2 mt-6">
      {/* General file fields */}
      {fields
        .filter((field) => field.type === "file") // Filter for file type fields
        .map((field, index) => {
          const fileUrl = getNestedObjectValue(item, field.value);
          return (
            fileUrl?.length > 0 && (
              <div className="flex flex-col my-2" key={index}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  {field.label}
                </label>
                {fileUrl.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="\dummy.png" // Replace with actual dummy image path
                      alt="Dummy PDF Thumbnail"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, field.label)}
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
                      src={fileUrl}
                      alt={field.label}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View File
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, field.label)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          );
        })}

      {/* Invoice Files */}
      {multiple === "Invoices" &&
      item?.invoiceInfo &&
      Object.keys(item.invoiceInfo)
        ?.filter((key) => key?.includes("invoiceFile"))
        ?.map((fileKey, index) => {
          const fileUrl = item?.invoiceInfo?.[fileKey];
          return (
            fileUrl?.length > 0 && (
              <div className="flex flex-col my-2" key={index}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  Invoice File {index + 1}
                </label>
                {fileUrl.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="\dummy.png" // Replace with actual dummy image path
                      alt="Dummy PDF Thumbnail"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `Invoice File ${index + 1}`)}
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
                      src={fileUrl}
                      alt={`Invoice File ${index + 1}`}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View File
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `Invoice File ${index + 1}`)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          );
        })}
      {/* LOR Files */}
      {multiple==="Admission Process Details" && item?.admissionInfo && Object.keys(item?.admissionInfo)
        .filter((key) => key.includes("lorFile")) // Filter by lor type files
        .map((fileKey, index) => {
          const fileUrl = item?.admissionInfo?.[fileKey];
          return (
            fileUrl?.length > 0 && (
              <div className="flex flex-col my-2" key={index}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  LOR File {index + 1}
                </label>
                {fileUrl.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="\dummy.png" // Replace with actual dummy image path
                      alt="Dummy PDF Thumbnail"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `LOR File ${index + 1}`)}
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
                      src={fileUrl}
                      alt={`LOR File ${index + 1}`}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View File
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `LOR File ${index + 1}`)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          );
        })}

      {/* LOM Files */}
      {multiple==="Admission Process Details" && item?.admissionInfo && Object.keys(item?.admissionInfo)
        .filter((key) => key.includes("lomFile")) // Filter by lom type files
        .map((fileKey, index) => {
          const fileUrl = item?.admissionInfo?.[fileKey];
          return (
            fileUrl?.length > 0 && (
              <div className="flex flex-col my-2" key={index}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  LOM File {index + 1}
                </label>
                {fileUrl.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="\dummy.png" // Replace with actual dummy image path
                      alt="Dummy PDF Thumbnail"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `LOM File ${index + 1}`)}
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
                      src={fileUrl}
                      alt={`LOM File ${index + 1}`}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View File
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `LOM File ${index + 1}`)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          );
        })}

    {multiple==="Admission Process Details" && item?.admissionInfo &&  Object.keys(item?.admissionInfo)
        .filter((key) => key.includes("sopFile")) // Filter by lom type files
        .map((fileKey, index) => {
          const fileUrl = item?.admissionInfo?.[fileKey];
          return (
            fileUrl?.length > 0 && (
              <div className="flex flex-col my-2" key={index}>
                <label className="text-gray-400 md:font-medium font-sm my-2">
                  SOP File {index + 1}
                </label>
                {fileUrl.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center">
                    <img
                      src="\dummy.png" // Replace with actual dummy image path
                      alt="Dummy PDF Thumbnail"
                      className="h-auto md:w-[100px] w-[100px] mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `SOP File ${index + 1}`)}
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
                      src={fileUrl}
                      alt={`SOP File ${index + 1}`}
                      className="w-[200px] md:h-auto h-auto mb-2"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button
                        onClick={() => openPDF(fileUrl)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        View File
                      </button>
                      <button
                        onClick={() => handleDownload(fileUrl, `LOM File ${index + 1}`)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          );
        })}
    </div>
  </div>
  );
};

export default ViewClient;

