// app/components/AddEdit.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik, FieldArray } from "formik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import apiClient from "@/app/utils/apiClient";

interface FieldConfig {
  label: string;
  name: string; // dot-notation supported
  type: string;
  folder?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  dependsOn?: {
    field: string; // dot path
    value?: string | number | boolean | Array<string | number | boolean>;
    valueIsNot?: string | number | boolean;
  };
  trueValue?: any;
  falseValue?: any;
  display?: "horizontal" | "dropdown";
  itemType?: string;
}

interface AddEditProps {
  fields: FieldConfig[];
  initialData?: Record<string, any> | null;
  onSubmit: (data: Record<string, any>) => void;
  grid?: number;
}

export default function AddEdit({
  fields,
  initialData = null,
  onSubmit,
  grid = 3,
}: AddEditProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [othersMode, setOthersMode] = useState<Record<string, boolean>>({});

  // Utility: get nested by dot
  const getIn = (obj: any, path: string) =>
    path?.split(".")?.reduce((a, k) => (a ? a[k] : undefined), obj);

  // strip out file fields from initial
  // useEffect(() => {
  //   if (!initialData) return setFormValues({});
  //   const base: Record<string, any> = {};
  //   Object.entries(initialData).forEach(([k, v]) => {
  //     if (!fields.some((f) => f.name === k && f.type === "file")) {
  //       base[k] = v;
  //     }
  //   });
  //   setFormValues(base);
  // }, [initialData, fields]);

  // file upload
  const handleFileUpload = async (
    file: File,
    name: string,
    setFieldValue: (f: string, v: any) => void,
    folderNameFromConfig?: string
  ) => {
    setLoading(true);
    const folder = folderNameFromConfig || name.split(".").pop();

    try {
      console.log("📤 Starting upload for:", file.name);

      // Step 1: Get Signed URL from API
      const response = await apiClient.post("/api/auth/sign_s3", {
        fileName: file.name,
        fileType: file.type,
        folderName: folder,
      });

      const { uploadURL, fileURL } = response.data;
      console.log("✅ Received signed URL:", uploadURL);
      console.log("📁 File will be accessible at:", fileURL);

      // Step 2: Upload file using signed URL
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed with status: " + uploadRes.status);
      }

      console.log("✅ File uploaded successfully to S3");

      // Step 3: Set file URL in form field
      setFieldValue(name, fileURL);
      console.log("📝 Form field updated with S3 file URL");
    } catch (error) {
      console.error("❌ File upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // reorder: non-file first
  const ordered = [
    ...fields.filter((f) => f.type !== "file"),
    ...fields.filter((f) => f.type === "file"),
  ];

  // helpers
  const openPDF = (url: string) => window.open(url, "_blank")?.focus();
  
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

  return (
    <div className="mx-auto bg-white shadow-lg rounded-lg p-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex flex-col items-center justify-center z-50">
          <div className="animate-spin h-12 w-12 border-4 border-white rounded-full mb-4" />
          <span className="text-white">Uploading…</span>
        </div>
      )}
        <Formik
          initialValues={initialData || {}}   // ← raw data, with nested keys
          enableReinitialize
          onSubmit={onSubmit}
        >        
        {({ values, setFieldValue }) => (
          <Form className="space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-${grid} gap-6`}>
              {ordered.map((f) => {
                // dependencies
                if (f.dependsOn) {
                  const actual = getIn(values, f.dependsOn.field);

                  // 1) show-when-equal (scalar or array of allowed values)
                  if (f.dependsOn.value !== undefined) {
                    if (Array.isArray(f.dependsOn.value)) {
                      // if actual isn't one of the allowed values, skip
                      if (!f.dependsOn.value.includes(actual)) {
                        return null;
                      }
                    } else {
                      if (actual !== f.dependsOn.value) {
                        return null;
                      }
                    }
                  }

                  // 2) show-when-not-equal
                  if (f.dependsOn.valueIsNot !== undefined) {
                    if (actual === f.dependsOn.valueIsNot) {
                      return null;
                    }
                  }
                }

                // textarea
                if (f.type === "textarea") {
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="font-semibold text-deepblue">{f.label}</label>
                      <Field
                        as="textarea"
                        name={f.name}
                        placeholder={f.placeholder}
                        className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                        required={f.required}
                      />
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                    </div>
                  );
                }

                // select
                if (f.type === "select") {
                  const current = getIn(values, f.name);
                  const isOtherMode = othersMode[f.name] === true;

                  // if user picked "OTHERS", lock into text mode
                  if (!isOtherMode && current === "OTHERS") {
                    setOthersMode((m) => ({ ...m, [f.name]: true }));
                  }

                  if (isOtherMode) {
                    // always render text input once in Others-mode
                    return (
                      <div key={f.name} className="flex flex-col">
                        <label className="font-semibold text-deepblue">
                          {f.label}
                        </label>
                        <Field name={f.name}>
                          {({ field }: any) => (
                            <div className="relative">
                              <input
                                {...field}
                                type="text"
                                placeholder={`Specify other ${f.label.toLowerCase()}`}
                                className="w-full border rounded-lg px-3 py-2 pr-10 mt-1 focus:ring focus:ring-deepblue"
                                required={f.required}
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-600"
                                onClick={() => {
                                  setOthersMode((m) => ({ ...m, [f.name]: false }));
                                  setFieldValue(f.name, "");
                                }}
                                title="Revert to dropdown"
                              >
                                ❌
                              </button>
                            </div>
                          )}
                        </Field>
                        <ErrorMessage
                          name={f.name}
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    );
                  }

                  // normal dropdown
                    console.log("Form Values", values); // ← add this
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="text-sm font-semibold text-deepblue">
                        {f.label}
                      </label>
                      <Field
                        as="select"
                        name={f.name}
                        className="border rounded-lg px-3 py-2 mt-1 focus:ring focus:ring-deepblue"
                        required={f.required}
                        onChange={(e: any) => {
                          const v = e.target.value;
                          setFieldValue(f.name, v);
                          if (v === "OTHERS") {
                            setOthersMode((m) => ({ ...m, [f.name]: true }));
                            // clear out so user starts fresh
                            setFieldValue(f.name, "");
                          }
                        }}
                      >
                        <option value="">Select {f.label}</option>
                        {f.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name={f.name}
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  );
                }          

                // number
                if (f.type === "number") {
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="font-semibold text-deepblue">{f.label}</label>
                      <Field
                        type="number"
                        name={f.name}
                        placeholder={f.placeholder}
                        className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                        min={0}
                        required={f.required}
                      />
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                    </div>
                  );
                }

                // phoneNumber
                if (f.type === "phoneNumber") {
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="font-semibold text-deepblue">{f.label}</label>
                      <Field
                        name={f.name}
                        placeholder={f.placeholder}
                        className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                        maxLength={10}
                        onInput={(e: any) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                      />
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                    </div>
                  );
                }

                // checkbox
                if (f.type === "checkbox") {
                  const T = f.trueValue ?? true;
                  const F = f.falseValue ?? false;
                  return (
                    <div key={f.name} className="flex items-center gap-2">
                      <Field name={f.name}>
                        {({ field }: any) => (
                          <input
                            type="checkbox"
                            checked={field.value === T}
                            onChange={(e) =>
                              setFieldValue(f.name, e.target.checked ? T : F)
                            }
                            className="h-4 w-4"
                          />
                        )}
                      </Field>
                      <label className="font-medium text-deepblue">{f.label}</label>
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                    </div>
                  );
                }

                // multiselect
                if (f.type === "multiselect") {
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="font-semibold text-deepblue mb-1">{f.label}</label>
                      <Field name={f.name}>
                        {({ field }: any) => {
                          const selected: string[] = Array.isArray(field.value)
                            ? field.value
                            : [];

                          if (f.display === "horizontal") {
                            return (
                              <div className="flex flex-wrap gap-4">
                                {f.options?.map((o) => {
                                  const chk = selected.includes(o.value);
                                  return (
                                    <label key={o.value} className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={chk}
                                        onChange={(e) => {
                                          const next = new Set(selected);
                                          e.target.checked ? next.add(o.value) : next.delete(o.value);
                                          setFieldValue(f.name, Array.from(next));
                                        }}
                                        className="h-4 w-4 accent-deepblue"
                                      />
                                      {o.label}
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          }

                          // dropdown multiple
                          return (
                            <select
                              multiple
                              value={selected}
                              onChange={(e) => {
                                const opts = Array.from(
                                  (e.target as HTMLSelectElement).selectedOptions
                                ).map((opt) => opt.value);
                                setFieldValue(f.name, opts);
                              }}
                              className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                            >
                              {f.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          );
                        }}
                      </Field>
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                    </div>
                  );
                }

                //multi-add
                if (f.type === "multipleAdd") {
                  return (
                    <div key={f.name} className="flex flex-col mb-6">
                      <label className="font-semibold text-deepblue">{f.label}</label>
                      <FieldArray name={f.name}>
                        {({ push, remove, form }) => {
                          // 1️⃣ Resolve the array at any nested path:
                          const list: any[] = getIn(form.values, f.name) || [];
                
                          return (
                            <>
                              {list.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-2">
                                  {/* --- TEXT ITEM --- */}
                                  {f.itemType === "text" && (
                                    <Field
                                      name={`${f.name}[${idx}]`}
                                      placeholder={f.placeholder || ""}
                                      className="border rounded px-3 py-2 flex-1 focus:ring focus:ring-deepblue"
                                      required={!!f.required}
                                    />
                                  )}
                
                                  {/* --- SELECT ITEM --- */}
                                  {f.itemType === "select" && (
                                    <Field
                                      as="select"
                                      name={`${f.name}[${idx}]`}
                                      className="border rounded px-3 py-2 flex-1 focus:ring focus:ring-deepblue"
                                      required={!!f.required}
                                    >
                                      <option value="">Select…</option>
                                      {f.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </Field>
                                  )}
                
                                  {/* --- FILE ITEM --- */}
                                  {f.itemType === "file" && (
                                    <Field name={`${f.name}[${idx}]`}>
                                      {({ form, field }: any) => {
                                        const existingUrl = field.value;
                                        return (
                                          <div className="flex flex-col flex-1">
                                            {existingUrl && (
                                              <>
                                                <img
                                                  src={
                                                    existingUrl.endsWith(".pdf")
                                                      ? "/dummy.png"
                                                      : existingUrl
                                                  }
                                                  alt={f.label}
                                                  className="h-24 w-24 mb-2 object-cover"
                                                />
                                                <div className="flex gap-4 mb-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => openPDF(existingUrl)}
                                                    className="flex items-center text-blue-500"
                                                  >
                                                    <FontAwesomeIcon
                                                      icon={faEye}
                                                      className="mr-1"
                                                    />{" "}
                                                    View
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDownload(existingUrl, f.name)
                                                    }
                                                    className="flex items-center text-blue-500"
                                                  >
                                                    <FontAwesomeIcon
                                                      icon={faDownload}
                                                      className="mr-1"
                                                    />{" "}
                                                    Download
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                            <input
                                              type="file"
                                              accept=".pdf,.jpg,.png"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const {
                                                  uploadURL,
                                                  fileURL,
                                                } = (
                                                  await apiClient.post("/api/auth/sign_s3", {
                                                    fileName: file.name,
                                                    fileType: file.type,
                                                    folderName: f.folder,
                                                  })
                                                ).data;
                                                await fetch(uploadURL, {
                                                  method: "PUT",
                                                  body: file,
                                                });
                                                // 2️⃣ setFieldValue using the same dot-path plus index
                                                form.setFieldValue(
                                                  `${f.name}[${idx}]`,
                                                  fileURL
                                                );
                                              }}
                                              className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                                            />
                                            <ErrorMessage
                                              name={`${f.name}[${idx}]`}
                                              component="div"
                                              className="text-red-500 text-xs mt-1"
                                            />
                                          </div>
                                        );
                                      }}
                                    </Field>
                                  )}
                
                                  {/* remove button */}
                                  <button
                                    type="button"
                                    onClick={() => remove(idx)}
                                    className="text-red-500 relative left-[-2rem]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                
                              {/* 3️⃣ Push a new empty entry onto the same nested path */}
                              <button
                                type="button"
                                onClick={() =>
                                  push(f.itemType === "file" ? "" : "")
                                }
                                className="text-sm text-deepblue hover:underline"
                              >
                                + Add another
                              </button>
                            </>
                          );
                        }}
                      </FieldArray>
                      <ErrorMessage
                        name={f.name}
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  );
                }

                // file
                if (f.type === "file") {
                  const existing = getIn(initialData, f.name);
                  return (
                    <div key={f.name} className="flex flex-col">
                      <label className="font-semibold text-deepblue">{f.label}</label>
                      {existing && (
                        <>
                          <img
                            src={existing.endsWith(".pdf") ? "/dummy.png" : existing}
                            alt=""
                            className="h-24 w-24 mb-2 object-cover"
                          />
                          <div className="flex gap-4 mb-2">
                            <button type="button" onClick={() => openPDF(existing)} className="flex items-center text-blue-500">
                              <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                            </button>
                            <button type="button" onClick={() => handleDownload(existing, f.name)} className="flex items-center text-blue-500">
                              <FontAwesomeIcon icon={faDownload} className="mr-1" /> Download
                            </button>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, f.name, setFieldValue, f.folder);
                        }}
                        className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                      />
                      <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  );
                }

                // default text / email / date etc.
                return (
                  <div key={f.name} className="flex flex-col">
                    <label className="font-semibold text-deepblue">{f.label}</label>
                    <Field
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      className="border rounded px-3 py-2 focus:ring focus:ring-deepblue"
                      required={f.required}
                    />
                    <ErrorMessage name={f.name} component="div" className="text-red-500 text-xs" />
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-900 to-deepblue text-white rounded-lg font-semibold hover:opacity-90 transition"
              disabled={loading}
            >
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
