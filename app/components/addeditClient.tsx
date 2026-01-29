"use client";
import React, { useEffect, useState } from "react";
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  useFormikContext,
  FormikValues,
} from "formik";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import apiClient from "../utils/apiClient";

interface FieldConfig {
  label: string;
  name: string;
  type: string;
  folder?: string; // Optional folder property
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  initialValue?: boolean;
}

interface AddEditProps {
  fields: FieldConfig[];
  initialData?: { [key: string]: any } | null;
  onSubmit: (data: { [key: string]: any }) => void;
  validation?: any; // Validation schema(s)
  academic?: boolean;
  grid?: string;
}

const AddEditClient: React.FC<AddEditProps> = ({
  fields,
  initialData = {},
  onSubmit,
  validation,
  academic,
  grid
}) => {
  const [formValues, setFormValues] = useState<{ [key: string]: any }>({});
  const [stream, setStream] = useState("");
  const [testas, setTestas] = useState("");
  const [pgDuration, setPgDuration] = useState<number | null>(null);
  const [ugDuration, setUgDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [europassPackage, setEuropassPackage] = useState("");
  const [invoiceFiles, setInvoiceFiles] = useState([{}]);
  const [lorFiles, setLorFiles] = useState([{}]);
  const [lomFiles, setLomFiles] = useState([{}]);
  const [sopFiles, setSopFiles] = useState([{}]);

  const [semesterFiles, setSemesterFiles] = useState([{}]);
  const [customPackage, setCustomPackage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedCountry, setSelectedCountry]=useState("INDIA");
  const [country, setCountry] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [course, setCourse] = useState("");
  const [session, setSession] = useState("");
  const [exam, setExam] = useState("")
  const [customState, setCustomState] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [customSession, setCustomSession] = useState("");
  const [customExam, setCustomExam] = useState("");
  const [leadCategory, setLeadCategory] = useState("");

  useEffect(() => {
    if (initialData) {
      const filteredInitialData = Object.fromEntries(
        Object.entries(initialData).filter(
          ([key]) =>
            !fields.find((field) => field.name === key && field.type === "file")
        )
      );
      setFormValues(filteredInitialData);
    } else {
      setFormValues({});
    }
  }, [initialData, fields]);
  const handleFileUpload = async (
    file: File,
    fieldName: string,
    setFieldValue: (field: string, value: any) => void,
    folderNameFromConfig?: string, // added folder
  ) => {
    setLoading(true); // Activate loading state  
    if (file) {
      // if (
      //   fieldName === "studentInfo.passportSizePhoto" &&
      //   file.size > 30 * 1024
      // ) {
      //   // 30KB in bytes
      //   alert("File size exceeds 30KB. Please select a smaller image.");
      //   setLoading(false); // Ensure loading state is deactivated
      //   return;
      // }
      const folderName = folderNameFromConfig ? folderNameFromConfig : fieldName.split(".").pop();  // Extract the folder name from fieldName
  
      try {
        const response = await apiClient.post("/api/auth/sign_s3", {
          fileName: file.name,
          fileType: file.type,
          folderName,
        });
  
        const { uploadURL, fileURL } = response.data;
  
        await apiClient.put(uploadURL, file, {
          headers: {
            "Content-Type": file.type,
          },
        });
  
        setFieldValue(fieldName, fileURL);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("File upload failed. Please try again.");
      } finally {
        setLoading(false); // Deactivate loading state
      }
    } else {
      // Clear field if no file is provided
      setFieldValue(fieldName, "");
      setLoading(false); // Deactivate loading state
    }
  };
  
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
  const orderedFields = [
    ...fields.filter((field) => field.type !== "editor"),
    ...fields.filter((field) => field.type === "editor"),
  ];

  return (
    <div className="mx-auto bg-white shadow-lg rounded-lg p-8">
      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white border-opacity-75"></div>
          <p className="text-white text-lg mt-4 absolute top-2/3">
            Uploading...
          </p>
        </div>
      )}
      <Formik
        initialValues={formValues}
        enableReinitialize
        // validate={validation}
        // validationSchema={validation}
        // Apply the validation schema here
        onSubmit={(values) => {
          onSubmit(values);
        }}
      >
        {({ setFieldValue, values }) => {
          useEffect(() => {
            setStream(values?.studentInfo?.degree || "");
            setTestas(values?.testasInfo?.testas || null);
            setUgDuration(values?.ugpgInfo?.ugDuration);
            setPgDuration(values?.ugpgInfo?.pgDuration);
            setEuropassPackage(values?.invoiceInfo?.europassPackage || "");
            setCountry(values?.personalInfo?.country || "");
            setState(values?.personalInfo?.state || "")
            setCity(values?.studentInfo?.cityApplyingFor || "")
            setCourse(values?.studentInfo?.courseApplyingFor || "")
            setExam(values?.studentInfo?.testExam || "")
            setLeadCategory(values?.leadCategory)
          }, [
            values?.studentInfo?.degree,
            values?.testasInfo?.testas,
            values?.ugpgInfo?.ugDuration,
            values?.ugpgInfo?.pgDuration,
            values?.invoiceInfo?.europassPackage,
            values?.personalInfo?.country,
            values?.personalInfo?.state,
            // values?.studentReg?.cityApplyingFor,
            values?.studentInfo?.courseApplyingFor,
            values?.studentInfo?.testExam,
            values?.leadCategory
          ]);
          return (
            <Form className="space-y-6">
              <div className={`grid grid-cols-1 md:grid-cols-${grid ? 2 : 3} gap-6`}>
                {orderedFields.map((field) => {
                  const fieldName = field.name;
                  if (field.type === "textarea") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        <label
                          htmlFor={fieldName}
                          className="text-sm font-semibold text-deepblue"
                        >
                          {field.label}
                        </label>
                        <Field
                          as="textarea"
                          name={fieldName}
                          placeholder={field.placeholder}
                          className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                          required={field.required}
                        />
                        <ErrorMessage
                          name={fieldName}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }
                  if (field.type === "select") {
                  return (
                    <div key={field.name} className="flex flex-col">
                      <label
                        htmlFor={field.name}
                        className="text-sm font-semibold text-deepblue"
                      >
                        {field.label}
                      </label>
                      <Field
                        as="select"
                        name={field.name}
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        required={field.required}
                        defaultValue={
                          field.initialValue 
                            ? field.options?.[0]?.value // Default to the first option's value if initialValue exists
                            : ""
                        }
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name={field.name}
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  );
                  }
                  if (field.type === "phoneNumber") {
                  return (
                    <div key={field.name} className="flex flex-col">
                      <label className="text-sm font-semibold text-deepblue">
                        {field.label}
                      </label>
                      <Field
                        name={field.name}
                        type="text"
                        placeholder={field.placeholder}
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        required={field.required}
                        maxLength={10} // Set maximum length to 10 digits
                        pattern="\d{10}" // Regex to ensure exactly 10 digits
                        title="Phone number must be exactly 10 digits"
                        onInput={(e : any) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
                        }}
                      />
                      <ErrorMessage
                        name={field.name}
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  );
                  }                   
                  if (field.type === "checkbox") {
                    const { values, setFieldValue } =
                      useFormikContext<FormikValues>();

                    return (
                      <div key={fieldName} className="flex items-center">
                        <Field
                          type="checkbox"
                          name={fieldName}
                          checked={!!values[fieldName as keyof FormikValues]}
                          onChange={() =>
                            setFieldValue(
                              fieldName,
                              !values[fieldName as keyof FormikValues]
                            )
                          }
                          className="mr-2 focus:ring focus:ring-deepblue"
                          required={field.required}
                        />
                        <label
                          htmlFor={fieldName}
                          className="text-sm font-semibold text-deepblue"
                        >
                          {field.label}
                        </label>
                        <ErrorMessage
                          name={fieldName}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }
                  if (field.type === "file") {
                    const getValue = (name: any) => {
                      const fieldParts = name.split(".");
                      return fieldParts.reduce(
                        (acc: any, part: any) => acc?.[part],
                        formValues
                      ); 
                    };
                    return (
                      <div key={field.name} className="w-full">
                        <label className="block mb-2 text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                        {getValue(field.name) && (
                          <div className="flex flex-col justify-center items-center"><img
                            src={getValue(field.name)?.endsWith("pdf") ? "/dummy.png" : getValue(field.name) || ""}
                            alt={field.label}
                            className="w-auto h-[100px] mb-2" /><div className="flex space-x-4 mt-2">
                              <button
                                onClick={() => openPDF(getValue(field.name))}
                                className="text-green-500 hover:text-green-700 flex items-center"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-2" />
                                View PDF
                              </button>
                              <button
                                onClick={() => handleDownload(getValue(field.name), fieldName)}
                                className="text-blue-500 hover:text-blue-700 flex items-center"
                              >
                                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                Download
                              </button>
                              <button
                                //@ts-ignore
                                onClick={() => handleFileUpload("", field.name, setFieldValue)}
                                className="text-red-500 hover:text-red-700 flex items-center"
                              >
                                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                Remove
                              </button>
                            </div></div>
                        )}
                        <input
                          type="file"
                          name={field.name}
                          onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            // Handle the file upload and update the nested field
                            handleFileUpload(file, field.name, setFieldValue, field.folder);
                          }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name={field.name}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }
                  if (field.type === "invoice") {
                    const getInvoiceValue = (name: string) => {
                      const fieldParts = name.split(".");
                      return fieldParts.reduce((acc, part) => acc?.[part], formValues); // Access the existing file value based on the name
                    };
                  
                    return (
                      <div className="flex flex-col gap-4">
                        {invoiceFiles.map((_, index) => {
                          const invoiceFileName = `invoiceInfo.invoiceFile${index}`;
                          const existingInvoice = getInvoiceValue(invoiceFileName);
                  
                          return (
                            <div key={index} className="flex flex-col">
                              <label
                                htmlFor={invoiceFileName}
                                className="text-sm font-semibold text-deepblue"
                              >
                                Invoice {index + 1}
                              </label>
                  
                              {/* Display the existing file if available */}
                              {existingInvoice && (
                                <div className="flex flex-col items-center mb-2">
                                  <img
                                  //@ts-ignore
                                    src={existingInvoice.endsWith("pdf") ? "/dummy.png" : existingInvoice}
                                    alt={`Invoice ${index + 1}`}
                                    className="h-auto md:w-[100px] w-[100px] mb-2"
                                  />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                      //@ts-ignore
                                      onClick={() => openPDF(existingInvoice)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(`invoiceInfo.invoiceFile${index}`, `invoiceFile${index}`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", invoiceFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                  
                              {/* File input for uploading new file */}
                              <input
                                type="file"
                                name={invoiceFileName}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, invoiceFileName, setFieldValue);
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                  
                              <ErrorMessage
                                name={invoiceFileName}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                  
                        <button
                          type="button"
                          onClick={() => setInvoiceFiles([...invoiceFiles, {}])}
                          className="bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen` text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          Another Invoice
                        </button>
                      </div>
                    );
                  }
                  if (field.type === "lor") {
                    const getLorValue = (name: string) => {
                      const fieldParts = name.split(".");
                      return fieldParts.reduce((acc, part) => acc?.[part], formValues); // Access the existing file value based on the name
                    };
                  
                    return (
                      <div className="flex flex-col gap-4">
                        {lorFiles.map((_, index) => {
                          const lorFileName = `admissionInfo.lorFile${index}`;
                          const existingLor = getLorValue(lorFileName);
                  
                          return (
                            <div key={index} className="flex flex-col">
                              <label
                                htmlFor={lorFileName}
                                className="text-sm font-semibold text-deepblue"
                              >
                                LOR {index + 1}
                              </label>
                  
                              {/* Display the existing file if available */}
                              {existingLor && (
                                <div className="flex flex-col items-center mb-2">
                                  <img
                                  //@ts-ignore
                                    src={existingLor.endsWith("pdf") ? "/dummy.png" : existingLor}
                                    alt={`LOR ${index + 1}`}
                                    className="h-auto md:w-[100px] w-[100px] mb-2"
                                  />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                    //@ts-ignore
                                      onClick={() => openPDF(existingLor)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(`admissionInfo.lorFile${index}`, `lorFile${index}`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                  
                              {/* File input for uploading new file */}
                              <input
                                type="file"
                                name={lorFileName}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, lorFileName, setFieldValue);
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                  
                              <ErrorMessage
                                name={lorFileName}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                  
                        <button
                          type="button"
                          onClick={() => setLorFiles([...lorFiles, {}])}
                          className="bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen` text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          Another LOR
                        </button>
                      </div>
                    );
                  }
                  if (field.type === "lom") {
                    const getLomValue = (name: string) => {
                      const fieldParts = name.split(".");
                      return fieldParts.reduce((acc, part) => acc?.[part], formValues); // Access the existing file value based on the name
                    };    
                    return (
                      <div className="flex flex-col gap-4">
                        {lomFiles.map((_, index) => {
                          const lomFileName = `admissionInfo.lomFile${index}`;
                          const existingLom = getLomValue(lomFileName);
                  
                          return (
                            <div key={index} className="flex flex-col">
                              <label
                                htmlFor={lomFileName}
                                className="text-sm font-semibold text-deepblue"
                              >
                                LOM {index + 1}
                              </label>
                  
                              {/* Display the existing file if available */}
                              {existingLom && (
                                <div className="flex flex-col items-center mb-2">
                                  <img
                                  //@ts-ignore
                                    src={existingLom.endsWith("pdf") ? "/dummy.png" : existingLom}
                                    alt={`LOM ${index + 1}`}
                                    className="h-auto md:w-[100px] w-[100px] mb-2"
                                  />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                      //@ts-ignore
                                      onClick={() => openPDF(existingLom)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(`admissionInfo.lomFile${index}`, `lomFile${index}`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", lomFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                  
                              {/* File input for uploading new file */}
                              <input
                                type="file"
                                name={lomFileName}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, lomFileName, setFieldValue);
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                  
                              <ErrorMessage
                                name={lomFileName}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                  
                        <button
                          type="button"
                          onClick={() => setLomFiles([...lomFiles, {}])}
                          className="bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen` text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          Another LOM
                        </button>
                      </div>
                    );
                  }
                  if (field.type === "sop") {
                    const getSopValue = (name: string) => {
                      const fieldParts = name.split(".");
                      return fieldParts.reduce((acc, part) => acc?.[part], formValues); // Access the existing file value based on the name
                    };
                    return (
                      <div className="flex flex-col gap-4">
                        {sopFiles.map((_, index) => {
                          const sopFileName = `admissionInfo.sopFile${index}`;
                          const existingSop = getSopValue(sopFileName);
                  
                          return (
                            <div key={index} className="flex flex-col">
                              <label
                                htmlFor={sopFileName}
                                className="text-sm font-semibold text-deepblue"
                              >
                                SOP {index + 1}
                              </label>
                  
                              {/* Display the existing file if available */}
                              {existingSop && (
                                <div className="flex flex-col items-center mb-2">
                                  <img
                                  //@ts-ignore
                                    src={existingSop.endsWith("pdf") ? "/dummy.png" : existingSop}
                                    alt={`SOP ${index + 1}`}
                                    className="h-auto md:w-[100px] w-[100px] mb-2"
                                  />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                    //@ts-ignore
                                      onClick={() => openPDF(existingSop)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(`admissionInfo.sopFile${index}`, `sopFile${index}`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", sopFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                  
                              {/* File input for uploading new file */}
                              <input
                                type="file"
                                name={sopFileName}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(file, sopFileName, setFieldValue);
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                  
                              <ErrorMessage
                                name={sopFileName}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                  
                        <button
                          type="button"
                          onClick={() => setSopFiles([...sopFiles, {}])}
                          className="bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen` text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          Another SOP
                        </button>
                      </div>
                    );
                  }
                  if (field.type === "semester") {
                    const getInvoiceValue = (name: string) => {
                      const fieldParts = name;
                      return formValues[fieldParts]; // Access the existing file value based on the name
                    }; 
                    return (
                      <div className="flex flex-col gap-4">
                        {semesterFiles.map((_, index) => {
                          const semesterFileName = `semester${index}`;
                          const existingSemester = getInvoiceValue(semesterFileName);
                  
                          return (
                            <div key={index} className="flex flex-col">
                              <label
                                htmlFor={semesterFileName}
                                className="text-sm font-semibold text-deepblue"
                              >
                                Semester {index + 1} fee
                              </label>
                  
                              {/* Display the existing value in a text input if available */}
                              {existingSemester && (
                                <div className="flex flex-col mb-2">
                                  <input
                                    type="text"
                                    name={semesterFileName}
                                    //@ts-ignore
                                    // value={existingSemester}
                                    defaultValue={existingSemester}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setFieldValue(semesterFileName, value); // Set the updated file path
                                    }}
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                                  />
                                </div>
                              )}
                  
                              {/* Text input for new file */}
                              {!existingSemester && (
                                <input
                                  type="text"
                                  name={semesterFileName}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setFieldValue(semesterFileName, value); // Set the new file path
                                  }}
                                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                                />
                              )}
                  
                              <ErrorMessage
                                name={semesterFileName}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                  
                        <button
                          type="button"
                          onClick={() => setSemesterFiles([...semesterFiles, {}])}
                          className="bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          Another Semester
                        </button>
                      </div>
                    );
                  }                        
                  if (field.type === "package") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label
                          htmlFor={fieldName}
                          className="text-sm font-semibold text-deepblue"
                        >
                          {field.label}
                        </label>

                        {/* Dynamic Field Rendering */}
                        {selectedPackage !== " " &&
                        (!europassPackage ||
                          field.options?.some(
                            (option) => option.value === europassPackage
                          )) ? (
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={selectedPackage || europassPackage || ""}
                            onChange={(event: any) => {
                              const selectedValue = event.target.value;

                              // Switch to input field if "Others" is selected
                              if (selectedValue === " ") {
                                setCustomPackage(""); // Clear any previous custom input
                              }

                              setSelectedPackage(selectedValue);
                              setFieldValue(fieldName, selectedValue);
                            }}
                            required={field.required}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                            <option value=" ">Others</option>
                          </Field>
                        ) : (
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            {/* Input Field for Custom Package */}
                            <input
                              type="text"
                              value={customPackage || europassPackage || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomPackage(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom package"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                // Reset to initial dropdown state
                                setSelectedPackage(""); // Reset dropdown
                                setCustomPackage(""); // Clear custom input
                                setFieldValue(fieldName, ""); // Reset form value
                              }}
                            >
                              X
                            </p>
                          </div>
                        )}

                        {/* Error Message */}
                        <ErrorMessage
                          name={fieldName}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }
                  if (field.type === "testas") {
                    return (
                      <>
                        {/* Dropdown for Testas */}
                        <div className="flex flex-col mb-4">
                          <label
                            htmlFor="testasDropdown"
                            className="text-sm font-semibold text-deepblue"
                          >
                            Testas
                          </label>
                          <select
                            id="testasDropdown"
                            name="testasInfo.testas"
                            value={values?.testasInfo?.testas || ""} // Ensure the selected value is properly set for edit mode
                            onChange={(e) => {
                              setFieldValue("testasInfo.testas", e.target.value);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage
                            name="testasInfo.testas"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Conditionally render input fields if the selected option is "REQUIRED" */}
                        {values?.testasInfo?.testas === "REQUIRED" && (
                          <>
                            {/* Testas Registration */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="testasRegistration"
                                className="text-sm font-semibold text-deepblue"
                              >
                                Testas Registration
                              </label>
                              <select
                                id="testasRegistration"
                                name="testasInfo.testasRegistration"
                                value={
                                  values?.testasInfo?.testasRegistration || ""
                                }
                                onChange={(e) => {
                                  setFieldValue(
                                    "testasInfo.testasRegistration",
                                    e.target.value
                                  );
                                }}
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              >
                                <option value="">Select an option</option>
                                <option value="DONE">DONE</option>
                                <option value="PENDING">PENDING</option>
                              </select>
                              <ErrorMessage
                                name="testasInfo.testasRegistration"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            {/* Testas Admit Card */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="testasAdmitCard"
                                className="text-sm font-semibold text-deepblue"
                              >
                                Testas Admit Card
                              </label>
                              {values?.testasInfo?.testasAdmitCard && (
                                <><img
                                  src={values?.testasInfo?.testasAdmitCard?.endsWith("pdf") ? "/dummy.png" : values?.testasInfo?.testasAdmitCard || ""}
                                  alt={"TESTAS ADMIT"}
                                  className="w-[100px] h-auto mb-2" />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.testasInfo?.testasAdmitCard)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.testasInfo?.testasAdmitCard, `testasAdmitCard`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", "testasInfo.testasAdmitCard", setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </>
                              )}
                              <input
                                type="file"
                                name="testasInfo.testasAdmitCard"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "testasInfo.testasAdmitCard",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="testasInfo.testasAdmitCard"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            {/* Testas Certificate */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="testasCertificate"
                                className="text-sm font-semibold text-deepblue"
                              >
                                Testas Certificate
                              </label>
                              {values?.testasInfo.testasCertificate && (
                                <><img
                                  src={values?.testasInfo.testasCertificate?.endsWith("pdf") ? "/dummy.png" : values?.testasInfo.testasCertificate || ""}
                                  alt={"TESTAS CERTIFICATE"}
                                  className="w-[100px] h-auto mb-2" /><div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.testasInfo?.testasCertificate)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.testasInfo?.testasCertificate, `testasCertificate`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("", "testasInfo.testasCertificate", setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div></>
                              )}
                              <input
                                type="file"
                                name="testasInfo.testasCertificate"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "testasInfo.testasCertificate",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="testasInfo.testasCertificate"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </>
                        )}
                      </>
                    );
                  }
                  if (field.type === "aps") {
                    return (
                      <>
                        {/* Dropdown for Testas */}
                        <div className="flex flex-col mb-4">
                          <label
                            htmlFor="aps"
                            className="text-sm font-semibold text-deepblue"
                          >
                            APS
                          </label>
                          <select
                            id="apsDropdown"
                            name="apsInfo.aps"
                            value={values?.apsInfo?.aps || ""} // Ensure the selected value is properly set for edit mode
                            onChange={(e) => {
                              setFieldValue("apsInfo.aps", e.target.value);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage
                            name="apsInfo.aps"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        {/* Conditionally render input fields if the selected option is "REQUIRED" */}
                        {values?.apsInfo?.aps === "REQUIRED" && (
                          <>
                            {/* APS Receipt */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="apsReceipt"
                                className="text-sm font-semibold text-deepblue"
                              >
                                APS Receipt (pdf only)
                              </label>
                              {values?.apsInfo.apsReceipt && (
                                <><img
                                  src={values?.apsInfo.apsReceipt?.endsWith("pdf") ? "/dummy.png" : values?.apsInfo.apsReceipt || ""}
                                  alt={"APS Receipt"}
                                  className="w-[100px] h-auto mb-2" /><div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.apsInfo.apsReceipt)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.apsInfo.apsReceipt, `apsReceipt`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload(file,"apsInfo.apsReceipt", setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div></>
                              )}
                              <input
                                type="file"
                                name="apsInfo.apsReceipt"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "apsInfo.apsReceipt",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="apsInfo.apsReceipt"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            {/* APS Student Authorized letter */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="apsStudentAuthLetter"
                                className="text-sm font-semibold text-deepblue"
                              >
                                APS Student Authorized letter (pdf only)
                              </label>
                              {values?.apsInfo.apsAuthLetter && (
                                <><img
                                  src={values?.apsInfo.apsAuthLetter?.endsWith("pdf") ? "/dummy.png" : values?.apsInfo.apsAuthLetter || ""}
                                  alt={"APS Auth Letter"}
                                  className="w-[100px] h-auto mb-2" /><div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.apsInfo.apsAuthLetter)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.apsInfo.apsAuthLetter, `apsAuthLetter`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("apsInfo.apsAuthLetter", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div></>
                              )}
                              <input
                                type="file"
                                name="apsInfo.apsAuthLetter"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "apsInfo.apsAuthLetter",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="apsInfo.apsAuthLetter"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                            {/* APS Consent letter */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="apsConsentLetter"
                                className="text-sm font-semibold text-deepblue"
                              >
                                APS Student Consent letter (pdf only)
                              </label>
                              {values?.apsInfo.apsConsentLetter && (
                                <><img
                                  src={values?.apsInfo.apsConsentLetter?.endsWith("pdf") ? "/dummy.png" : values?.apsInfo.apsConsentLetter || ""}
                                  alt={"APS Consent Letter"}
                                  className="w-[100px] h-auto mb-2" /><div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.apsInfo.apsConsentLetter)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.apsInfo.apsConsentLetter, `apsConsentLetter`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("apsInfo.apsConsentLetter", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div></>
                              )}
                              <input
                                type="file"
                                name="apsInfo.apsConsentLetter"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "apsInfo.apsConsentLetter",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="apsInfo.apsConsentLetter"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            {/* APS Certificate */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="apsCertificate"
                                className="text-sm font-semibold text-deepblue"
                              >
                                APS Certificate (pdf only)
                              </label>
                              {values?.apsInfo.apsCertificate && (
                                <>
                                <img
                                  src={values?.apsInfo.apsCertificate?.endsWith("pdf") ? "/dummy.png": values?.apsInfo?.apsCertificate || ""}
                                  alt={"APS Certificate"}
                                  className="w-[100px] h-auto mb-2"
                                />
                                <div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.apsInfo?.apsAdmitCard)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.apsInfo?.apsAdmitCard, `apsAdmitCard`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("apsInfo.apsCertificate", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                </div>
                                </>
                              )}
                              <input
                                type="file"
                                name="apsInfo.apsCertificate"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "apsInfo.apsCertificate",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="apsInfo.apsCertificate"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </>
                        )}
                      </>
                    );
                  }
                  if (field.type === "ielts") {
                    return (
                      <>
                        {/* Dropdown for ielts */}
                        <div className="flex flex-col mb-4">
                          <label
                            htmlFor="ielts"
                            className="text-sm font-semibold text-deepblue"
                          >
                            IELTS
                          </label>
                          <select
                            id="ieltsDropdown"
                            name="ieltsInfo.ielts"
                            value={values?.ieltsInfo?.ielts || ""} // Ensure the selected value is properly set for edit mode
                            onChange={(e) => {
                              setFieldValue("ieltsInfo.ielts", e.target.value);
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage
                            name="ieltsInfo.ielts"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        {/* Conditionally render input fields if the selected option is "REQUIRED" */}
                        {values?.ieltsInfo?.ielts === "REQUIRED" && (
                          <>
                            {/* ielts Receipt */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="ieltsReceipt"
                                className="text-sm font-semibold text-deepblue"
                              >
                                IELTS Receipt (pdf only)
                              </label>
                              {values?.ieltsInfo.ieltsReceipt && (
                                <><img
                                  src={values?.ieltsInfo.ieltsReceipt?.endsWith("pdf") ? "/dummy.png" : values?.ieltsInfo.ieltsReceipt || ""}
                                  alt={"ielts Receipt"}
                                  className="w-[100px] h-auto mb-2" />
                                  <div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.ieltsInfo.ieltsReceipt)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.ieltsInfo.ieltsReceipt, `ieltsReceipt`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ieltsInfo.ieltsReceipt", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                                </>
                              )}
                              <input
                                type="file"
                                name="ieltsInfo.ieltsReceipt"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "ieltsInfo.ieltsReceipt",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="ieltsInfo.ieltsReceipt"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            {/* ielts Certificate */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="ieltsCertificate"
                                className="text-sm font-semibold text-deepblue"
                              >
                                IELTS Certificate (pdf only)
                              </label>
                              {values?.ieltsInfo.ieltsCertificate && (
                                <>
                                <img
                                  src={values?.ieltsInfo.ieltsCertificate?.endsWith("pdf") ? "/dummy.png": values?.ieltsInfo?.ieltsCertificate || ""}
                                  alt={"ielts Certificate"}
                                  className="w-[100px] h-auto mb-2"
                                />
                                <div className="flex space-x-4 mt-2">
                                    <button
                                      onClick={() => openPDF(values?.ieltsInfo?.ieltsCertificate)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() => handleDownload(values?.ieltsInfo?.ieltsCertificate, `ieltsCertificate`)}
                                      className="text-blue-500 hover:text-blue-700 flex items-center"
                                    >
                                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                      Download
                                    </button>
                                    <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ieltsInfo.ieltsCertificate", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                </div>
                                </>
                                
                              )}
                              <input
                                type="file"
                                name="ieltsInfo.ieltsCertificate"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "ieltsInfo.ieltsCertificate",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="ieltsInfo.ieltsCertificate"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </>
                        )}
                      </>
                    );
                  }
                  if (field.type === "language") {
                    return (
                      <>
                        {/* Dropdown for Testas */}
                        <div className="flex flex-col mb-4">
                          <label
                            htmlFor="germanLanguage"
                            className="text-sm font-semibold text-deepblue"
                          >
                            German Language
                          </label>
                          <select
                            id="germanLanguage"
                            name="admissionInfo.germanLanguage"
                            value={values?.admissionInfo?.germanLanguage || ""} // Ensure the selected value is properly set for edit mode
                            onChange={(e) => {
                              setFieldValue(
                                "admissionInfo.germanLanguage",
                                e.target.value
                              );
                            }}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage
                            name="admissionInfo.germanLanguage"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Conditionally render input fields if the selected option is "REQUIRED" */}
                        {values?.admissionInfo?.germanLanguage === "REQUIRED" && (
                          <>
                            {/* Language Admission receipt */}
                            <div className="flex flex-col mb-4">
                              <label
                                htmlFor="germanLanguageReceipt"
                                className="text-sm font-semibold text-deepblue"
                              >
                                German Language Certificate (pdf only)
                              </label>
                              <input
                                type="file"
                                name="admissionInfo.germanLanguageReceipt"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      "admissionInfo.germanLanguageReceipt",
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name="admissionInfo.germanLanguageReceipt"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </>
                        )}
                      </>
                    );
                  }
                  if (field.type === "country") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                        {selectedCountry !== " " &&
                        (!country ||
                          field.options?.some((option) => option.value === country)) ? (
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={selectedCountry || country || ""}
                            onChange={(event:any) => {
                              const selectedValue = event.target.value;
                  
                              // Switch to input field if "Others" is selected
                              if (selectedValue === " ") {
                                setCustomCountry(""); // Clear any previous custom input
                              }
                  
                              setSelectedCountry(selectedValue);
                              setFieldValue(fieldName, selectedValue);
                            }}
                            required={field.required}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                            <option value=" ">Others</option>
                          </Field>
                        ) : (
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            {/* Input Field for Custom Package */}
                            <input
                              type="text"
                              value={customCountry || country || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomCountry(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom package"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                // Reset to initial dropdown state
                                setSelectedCountry(""); // Reset dropdown
                                setCustomCountry(""); // Clear custom input
                                setFieldValue(fieldName, ""); // Reset form value
                              }}
                            >
                              X
                            </p>
                          </div>
                        )}
                  
                        {/* Error Message */}
                        <ErrorMessage
                          name={fieldName}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }                
                  if (field.type === "state") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                  
                        {/* Dynamic Field Rendering for State */}
                        {(selectedCountry === "INDIA" ||country!=="INDIA" || selectedCountry === " ") ? (
                          // If "India" is selected or "Others" is selected
                          selectedCountry === "INDIA" ? (
                          // Dropdown for States when India is selected
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={state || ""}
                            onChange={(event: any) => {
                              const selectedState = event.target.value;
                              setState(selectedState);
                              setFieldValue(fieldName, selectedState);
                              setFieldValue("city", ""); // Reset the city field value
                            }}
                            required={field.required}
                          >
                            <option value="">Select State</option>
                            {/* @ts-ignore */}
                            {field?.options.map((stateOption) => (
                              <option key={stateOption.value} value={stateOption.value}>
                                {stateOption.label}
                              </option>
                            ))}
                          </Field>
                        ) : (
                          // Input field for custom state when "Others" is selected
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            <input
                              type="text"
                              value={customState || state || ""} // Show customState or existing state value
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomState(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom state"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                setCustomState(""); // Clear custom state input
                                setFieldValue(fieldName, ""); // Reset form value
                              }}
                            >
                              X
                            </p>
                          </div>
                          )
                        ) : (
                          // Dropdown for other countries' states
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={course || ""}
                            onChange={(event: any) => {
                              const selectedCourse = event.target.value;
                              setCourse(selectedCourse);
                              if (selectedCourse !== "OTHERS") {
                                setCustomCourse("");
                              }
                              setFieldValue(fieldName, selectedCourse);
                            }}
                            required={field.required}
                          >
                            <option value="">Select Course</option>
                            {/* @ts-ignore */}
                            {field.options.map((courseOption) => (
                              //@ts-ignore
                              <option key={courseOption} value={courseOption.value}>
                                {/* @ts-ignore */}
                                {courseOption.label}
                              </option>
                            ))}
                            <option value="OTHERS">OTHERS</option>
                          </Field>
                        )}
                  
                        {/* Error Message */}
                        <ErrorMessage name={fieldName} component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    );
                  }  
                  if (field.type === "city") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                  
                        {/* Dropdown for Cities based on selected state */}
                        <Field
                          as="select"
                          name={fieldName}
                          className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                          value={city}
                          onChange={(event: any) => {
                            const selectedCity = event.target.value;
                            setCity(selectedCity); // Set selected city value
                            setFieldValue(fieldName, selectedCity); // Update form field value
                          }}
                          required={field.required}
                        >
                          <option value="">Select City</option>
                          {/* @ts-ignore */}
                          {state && field.options[state]?.map((cityOption) => (
                            <option key={cityOption} value={cityOption}>
                              {cityOption}
                            </option>
                          ))}
                        </Field>
                  
                        {/* Error Message */}
                        <ErrorMessage name={fieldName} component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    );
                  }                          
                  if (field.type === "session") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                  
                        {/* Dynamic Field Rendering for Session */}
                        {session === "OTHERS" ? (
                          // Input field for custom session when "OTHERS" is selected
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            <input
                              type="text"
                              value={customSession || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomSession(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom session"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                setCustomSession("");
                                setSession("");
                                setFieldValue(fieldName, ""); // Reset to dropdown
                              }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          // Dropdown for Sessions
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={session || ""}
                            onChange={(event: any) => {
                              const selectedSession = event.target.value;
                              setSession(selectedSession);
                              if (selectedSession !== "OTHERS") {
                                setCustomSession("");
                              }
                              setFieldValue(fieldName, selectedSession);
                            }}
                            required={field.required}
                          >
                            <option value="">Select Session</option>
                            {field?.options?.map((sessionOption) => (
                              <option key={sessionOption?.value} value={sessionOption?.value}>
                                {sessionOption?.label}
                              </option>
                            ))}
                            <option value="OTHERS">OTHERS</option>
                          </Field>
                        )}
                  
                        {/* Error Message */}
                        <ErrorMessage name={fieldName} component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    );
                  }
                  if (field.type === "course") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                  
                        {/* Dynamic Field Rendering for Course */}
                        {course === "OTHERS" ? (
                          // Input field for custom Course when "OTHERS" is selected
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            <input
                              type="text"
                              value={customCourse || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomCourse(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom course"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                setCustomCourse("");
                                setCourse("");
                                setFieldValue(fieldName, ""); // Reset to dropdown
                              }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          // Dropdown for Course
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={course || ""}
                            onChange={(event: any) => {
                              const selectedCourse = event.target.value;
                              setCourse(selectedCourse);
                              if (selectedCourse !== "OTHERS") {
                                setCustomCourse("");
                              }
                              setFieldValue(fieldName, selectedCourse);
                            }}
                            required={field.required}
                          >
                            <option value="">Select Course</option>
                            {field?.options?.map((courseOption) => (
                              <option key={courseOption?.value} value={courseOption?.value}>
                                {courseOption?.label}
                              </option>
                            ))}
                            <option value="OTHERS">OTHERS</option>
                          </Field>
                        )}
                  
                        {/* Error Message */}
                        <ErrorMessage name={fieldName} component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    );
                  }   
                  if (field.type === "exam") {
                    return (
                      <div key={fieldName} className="flex flex-col">
                        {/* Label */}
                        <label htmlFor={fieldName} className="text-sm font-semibold text-deepblue">
                          {field.label}
                        </label>
                  
                        {/* Dynamic Field Rendering for Exam */}
                        {exam === "OTHERS" ? (
                          // Input field for custom Exam when "OTHERS" is selected
                          <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 py-2 mt-1">
                            <input
                              type="text"
                              value={customExam || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomExam(value);
                                setFieldValue(fieldName, value);
                              }}
                              placeholder="Enter custom exam"
                              className="w-full focus:outline-none"
                            />
                            {/* Reset Button */}
                            <p
                              className="cursor-pointer text-gray-500 ml-2"
                              onClick={() => {
                                setCustomExam("");
                                setExam("");
                                setFieldValue(fieldName, ""); // Reset to dropdown
                              }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          // Dropdown for Sessions
                          <Field
                            as="select"
                            name={fieldName}
                            className="border border-gray-300 rounded-lg px-4 py-2 mt-1"
                            value={exam || ""}
                            onChange={(event: any) => {
                              const selectedExam = event.target.value;
                              setExam(selectedExam);
                              if (selectedExam !== "OTHERS") {
                                setCustomExam("");
                              }
                              setFieldValue(fieldName, selectedExam);
                            }}
                            required={field.required}
                          >
                            <option value="">Select Exam</option>
                            {field?.options?.map((examOption) => (
                              <option key={examOption?.value} value={examOption?.value}>
                                {examOption?.label}
                              </option>
                            ))}
                            <option value="OTHERS">OTHERS</option>
                          </Field>
                        )}
                  
                        {/* Error Message */}
                        <ErrorMessage name={fieldName} component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    );
                  }                                                                               
                  return (
                    <div key={fieldName} className="flex flex-col">
                      <label
                        htmlFor={fieldName}
                        className="text-sm font-semibold text-deepblue"
                      >
                        {field.label}
                      </label>
                      <Field
                        name={fieldName}
                        type={field.type}
                        placeholder={field.placeholder}
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        required={field.required}
                      />
                      <ErrorMessage
                        name={fieldName}
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  );
                })}
                {/* Conditional rendering PG nested fields */}
                {(stream === "PG" && academic) && (
                  <>
                    <div className="flex flex-col">
                      {/* UG Duration Selector */}
                      <label
                        htmlFor="ugDuration"
                        className="text-sm font-semibold text-deepblue"
                      >
                        UG Duration
                      </label>
                      <Field
                        as="select"
                        name="ugpgInfo.ugDuration"
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const selectedValue = Number(e.target.value);
                          setUgDuration(selectedValue);
                          setFieldValue(
                            "ugpgInfo.ugDuration",
                            selectedValue
                          ); // Update Formik's value
                        }}
                      >
                        <option value="">Select UG Duration</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="4">4 Years</option>
                      </Field>

                      {/* Dynamic File Upload Inputs */}
                      {ugDuration &&
                        Array.from({
                          length:
                            ugDuration === 2 ? 4 : ugDuration === 3 ? 6 : 8,
                        }).map((_, idx) => {
                          const fieldKey = `ugpgInfo.ugFile${idx + 1}`;
                          const existingFileURL =
                            values?.ugpgInfo?.[`ugFile${idx + 1}`];
                          return (
                            <div key={`ug-upload-${idx}`} className="mt-4">
                              <label className="text-sm font-semibold text-deepblue mb-2">
                                UG Semester {idx + 1}
                              </label>
                              {existingFileURL && (
                                <>
                                {existingFileURL.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                </div>
                                ) : (
                                <img
                                 src={existingFileURL}
                                 alt={`ugFile${idx + 1}`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )}
                                <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(existingFileURL)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(existingFileURL, `ugFile${idx + 1}`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  
                              </div>
                                </>  
                              )
                              }
                              <input
                                type="file"
                                name={fieldKey}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      fieldKey,
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name={fieldKey}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Transcript
                        </label>
                          {values?.ugpgInfo?.ug_transcript && 
                          (
                                values?.ugpgInfo?.ug_transcript?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.ug_transcript)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.ug_transcript, `ug_transcript`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_transcript", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.ug_transcript}
                                 alt={`ug transcript`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                              )
                              }
                        <input
                          type="file"
                          name="ugpgInfo.ug_transcript"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_transcript",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_transcript"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Provisional degree
                        </label>
                        {values?.ugpgInfo?.ug_provisionalDegree &&  (
                                values?.ugpgInfo?.ug_provisionalDegree?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.ug_provisionalDegree)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.ug_provisionalDegree, `ug_provisionalDegree`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_provisionalDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.ug_provisionalDegree}
                                 alt={`ug transcript`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                              )}
                        <input
                          type="file"
                          name="ugpgInfo.ug_provisionalDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_provisionalDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_provisionalDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Complete degree
                        </label>
                        {values?.ugpgInfo?.ug_completeDegree && 
                        ((
                          values?.ugpgInfo?.ug_completeDegree?.endsWith(".pdf") ? (
                           <div className="flex flex-col items-center">
                           {/* Dummy Image */}
                           <img
                            src="/dummy.png"
                            alt="Dummy PDF Thumbnail"
                            className="h-auto md:w-[100px] w-[100px] mb-2"
                           />
                           <div className="flex space-x-4 mt-2">
                           <button
                            onClick={() => openPDF(values?.ugpgInfo?.ug_completeDegree)}
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                            >
                            <FontAwesomeIcon icon={faEye} className="mr-2" />
                            View PDF
                            </button>
                            <button
                            onClick={() => handleDownload(values?.ugpgInfo?.ug_completeDegree, `ug_completeDegree`)}
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                            >
                            <FontAwesomeIcon icon={faDownload} className="mr-2" />
                              Download
                            </button>
                            <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_completeDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                            </div>
                      </div>
                      ) : (
                          <img
                           src={values?.ugpgInfo?.ug_completeDegree}
                           alt={`ug transcript`}
                           className="w-full md:h-[100px] h-[100px] mb-2"
                          />
                          )
                        )
                        )
                        }
                        <input
                          type="file"
                          name="ugpgInfo.ug_completeDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_completeDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_completeDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* Conditional rendering PG and PHD nested fields */}
                {(stream === "PHD" && academic) && (
                  <>
                    <div className="flex flex-col">
                      {/* UG Duration Selector */}
                      <label
                        htmlFor="ugDuration"
                        className="text-sm font-semibold text-deepblue"
                      >
                        UG Duration
                      </label>
                      <Field
                        as="select"
                        name="ugpgInfo.ugDuration"
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const selectedValue = Number(e.target.value);
                          setUgDuration(selectedValue);
                          setFieldValue(
                            "ugpgInfo.ugDuration",
                            selectedValue
                          );
                        }}
                      >
                        <option value="">Select UG Duration</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="4">4 Years</option>
                      </Field>

                      {/* Dynamic File Upload Inputs */}
                      {ugDuration &&
                        Array.from({
                          length:
                            ugDuration === 2 ? 4 : ugDuration === 3 ? 6 : 8,
                        }).map((_, idx) => {
                          const fieldKey = `ugpgInfo.ugFile${idx + 1}`;
                          const existingFileURL =
                            values?.ugpgInfo?.[`ugFile${idx + 1}`];
                          return (
                            <div key={`ug-upload-${idx}`} className="mt-4">
                              <label className="text-sm font-semibold text-deepblue mb-2">
                                UG Semester {idx + 1}
                              </label>
                              {existingFileURL && (
                                <>
                                {existingFileURL.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                </div>
                                ) : (
                                <img
                                 src={existingFileURL}
                                 alt={`ugFile${idx + 1}`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )}
                                <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(existingFileURL)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(existingFileURL, `ugFile${idx + 1}`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  
                              </div>
                                </>  
                              )}
                              <input
                                type="file"
                                name={fieldKey}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      fieldKey,
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name={fieldKey}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Transcript
                        </label>
                        {values?.ugpgInfo?.ug_transcript && (
                                values?.ugpgInfo?.ug_transcript?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.ug_transcript)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.ug_transcript, `ug_transcript`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_transcript", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.ug_transcript}
                                 alt={`ug transcript`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                              )}
                        <input
                          type="file"
                          name="ugpgInfo.ug_transcript"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_transcript",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_transcript"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Provisional degree
                        </label>
                        {values?.ugpgInfo?.ug_provisionalDegree && (
                                values?.ugpgInfo?.ug_provisionalDegree?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.ug_provisionalDegree)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.ug_provisionalDegree, `ug_provisionalDegree`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_provisionalDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.ug_provisionalDegree}
                                 alt={`ug_provisionalDegree`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                        )}
                        <input
                          type="file"
                          name="ugpgInfo.ug_provisionalDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_provisionalDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_provisionalDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          UG Complete degree
                        </label>
                        {values?.ugpgInfo?.ug_completeDegree && (
                                values?.ugpgInfo?.ug_completeDegree?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.ug_completeDegree)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.ug_completeDegree, `ug_completeDegree`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.ug_completeDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.ug_completeDegree}
                                 alt={`ug_completeDegree`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                        )}
                        <input
                          type="file"
                          name="ugpgInfo.ug_completeDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.ug_completeDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.ug_completeDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* PHD */}
                    <div className="flex flex-col">
                      {/* UG Duration Selector */}
                      <label
                        htmlFor="pgDuration"
                        className="text-sm font-semibold text-deepblue"
                      >
                        PG Duration
                      </label>
                      <Field
                        as="select"
                        name="ugpgInfo.pgDuration"
                        className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const selectedValue = Number(e.target.value);
                          setPgDuration(selectedValue);
                          setFieldValue(
                            "ugpgInfo.pgDuration",
                            selectedValue
                          ); // Update Formik's value
                        }}
                      >
                        <option value="">Select PG Duration</option>
                        <option value="1">1 Years</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                      </Field>

                      {/* Dynamic File Upload Inputs */}
                      {pgDuration &&
                        Array.from({
                          length:
                            pgDuration === 1 ? 2 : pgDuration === 2 ? 4 : 6,
                        }).map((_, idx) => {
                          const fieldKey = `ugpgInfo.pgFile${idx + 1}`;
                          const existingFileURL =
                            values?.ugpgInfo?.[`pgFile${idx + 1}`];
                          return (
                            <div key={`pg-upload-${idx}`} className="mt-4">
                              <label className="text-sm font-semibold text-deepblue mb-2">
                                PG Semester {idx + 1}
                              </label>
                              {existingFileURL && (
                                existingFileURL.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(existingFileURL)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(existingFileURL, `pgFile${idx + 1}`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={existingFileURL}
                                 alt={`pgFile${idx + 1}`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                              )}
                              <input
                                type="file"
                                name={fieldKey}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      fieldKey,
                                      setFieldValue
                                    );
                                  }
                                }}
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                              />
                              <ErrorMessage
                                name={fieldKey}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          );
                        })}
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          PG Transcript
                        </label>
                        {values?.ugpgInfo?.pg_transcript && (
                                values?.ugpgInfo?.pg_transcript?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.pg_transcript)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.pg_transcript, `pg_transcript`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("ugpgInfo.pg_transcript", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.pg_transcript}
                                 alt={`ug transcript`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                              )}
                        <input
                          type="file"
                          name="ugpgInfo.pg_transcript"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.pg_transcript",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.pg_transcript"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          PG Provisional degree
                        </label>
                        {values?.ugpgInfo?.pg_provisionalDegree && (
                                values?.ugpgInfo?.pg_provisionalDegree?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.pg_provisionalDegree)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.pg_provisionalDegree, `pg_provisionalDegree`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("pg_provisionalDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.pg_provisionalDegree}
                                 alt={`pg_provisionalDegree`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                        )}
                        <input
                          type="file"
                          name="ugpgInfo.pg_provisionalDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.pg_provisionalDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.pg_provisionalDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="flex flex-col mt-5">
                        <label className="text-sm font-semibold text-deepblue">
                          PG Complete degree
                        </label>
                        {values?.ugpgInfo?.pg_completeDegree && (
                                values?.ugpgInfo?.pg_completeDegree?.endsWith(".pdf") ? (
                                 <div className="flex flex-col items-center">
                                 {/* Dummy Image */}
                                 <img
                                  src="/dummy.png"
                                  alt="Dummy PDF Thumbnail"
                                  className="h-auto md:w-[100px] w-[100px] mb-2"
                                 />
                                 <div className="flex space-x-4 mt-2">
                                 <button
                                  onClick={() => openPDF(values?.ugpgInfo?.pg_completeDegree)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                                  View PDF
                                  </button>
                                  <button
                                  onClick={() => handleDownload(values?.ugpgInfo?.pg_completeDegree, `pg_completeDegree`)}
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                  >
                                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                    Download
                                  </button>
                                  <button
                                    //@ts-ignore
                                    onClick={() => handleFileUpload("pg_completeDegree", lorFileName, setFieldValue)}
                                    className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                    Remove
                                    </button>
                                  </div>
                            </div>
                            ) : (
                                <img
                                 src={values?.ugpgInfo?.pg_completeDegree}
                                 alt={`pg_completeDegree`}
                                 className="w-full md:h-[100px] h-[100px] mb-2"
                                />
                                )
                        )}
                        <input
                          type="file"
                          name="ugpgInfo.pg_completeDegree"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                "ugpgInfo.pg_completeDegree",
                                setFieldValue
                              );
                            }
                          }}
                          accept=".pdf, .jpg, .jpeg, .png"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <ErrorMessage
                          name="ugpgInfo.pg_completeDegree"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                Submit
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddEditClient;
