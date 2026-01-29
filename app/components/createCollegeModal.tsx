/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import apiClient from "../utils/apiClient";
import Select from "react-select";

export interface College {
  name: string;
  country: string;
  state?: string;
  city?: string;
  img?: string;
  desc?: string;
  publish?: boolean;
  _id?: string;
  top?: boolean;
  website?: string;
}

interface CollegeModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (values: College) => void;
  college?: College; // Optional prop for edit mode
}

const CollegeModal: React.FC<CollegeModalProps> = ({
  show,
  onClose,
  onSave,
  college,
}) => {
  const formikRef = useRef<any>(null);

  const [states, setStates] = useState<{ label: string; value: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(college?.img || "");
  const [loadingUpload, setLoadingUpload] = useState(false);

  const countries = [
    "INDIA",
    "USA",
    "CANADA",
    "UK",
    "FINLAND",
    "MALTA",
    "LUXEMBOURG",
    "CHINA",
    "NEPAL",
    "BANGLADESH",
    "BHUTAN",
    "NEW ZEALAND",
    "SINGAPORE",
    "SWITZERLAND",
    "SWEDEN",
    "GERMANY",
    "GEORGIA",
    "AUSTRIA",
    "AUSTRALIA",
    "RUSSIA",
    "ITALY",
    "MAURITIUS",
  ];
  const countryOptions = countries.map((c) => ({ value: c, label: c }));

  // helpers to detect file type from URL
  const isImageUrl = (url: string) =>
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

  // Fetch states from the API
  const fetchStates = async () => {
    try {
      const response = await apiClient.get("/api/states"); // Replace with actual API URL
      setStates(response.data);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // Fetch cities based on the state selected
  const fetchCities = async (state: string) => {
    try {
      const response = await apiClient.get(`/api/cities?state=${state}`); // Replace with actual API URL
      setCities(response.data?.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // File upload function (same behaviour as TaskModal)
  const handleFileUpload = async (
    file: File,
    formFieldName: string,
    setFieldValue: (f: string, v: any) => void,
    folderNameFromConfig?: string
  ) => {
    setLoadingUpload(true);
    const folder = "colleges";

    try {
      const signRes = await fetch("/api/auth/sign_s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folderName: folder,
        }),
      });

      if (!signRes.ok) {
        throw new Error("Failed to get signed URL: " + signRes.status);
      }

      const signJson = await signRes.json();
      const { uploadURL, fileURL } = signJson;

      if (!uploadURL || !fileURL) {
        throw new Error("Signed URL or file URL missing in response");
      }

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

      setFieldValue(formFieldName, fileURL);
      setPreviewUrl(fileURL);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setLoadingUpload(false);
    }
  };

  // Initial values: if in edit mode, use college prop; otherwise empty.
  const initialValues: College = {
    name: college?.name || "",
    country: college?.country || "",
    state: college?.state || "",
    city: college?.city || "",
    img: college?.img || "",
    desc: college?.desc || "",
    publish: college?.publish || false,
    _id: college?._id,
    top: college?.top || false,
    website: college?.website || "",
  };

  // Reset form and preview when modal opens or college prop changes (same pattern as TaskModal)
  useEffect(() => {
    if (show) {
      // reset Formik form if available
      formikRef.current?.resetForm({
        values: {
          ...initialValues,
        },
      });
      setPreviewUrl(initialValues.img || "");
      // Pre-fetch states/cities if editing and required
      if (initialValues.country === "INDIA") {
        fetchStates();
        if (initialValues.state) fetchCities(initialValues.state);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, college]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold text-center mb-2">
          {college ? "Edit College Details" : "Enter College Details"}
        </h2>
        <Formik
          innerRef={formikRef}
          enableReinitialize
          initialValues={initialValues}
          validationSchema={Yup.object().shape({
            name: Yup.string().required("Name is required"),
            country: Yup.string().required("Country is required"),
          })}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(true);
            try {
              onSave(values);
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, resetForm }) => {
            // Auto-fetch states/cities based on values (keeps behaviour same as before)
            useEffect(() => {
              if (values.country === "INDIA" && states.length === 0) {
                fetchStates();
              }
              if (
                values.country === "INDIA" &&
                values.state &&
                cities.length === 0
              ) {
                fetchCities(values.state);
              }
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [values.country, values.state]);

            return (
              <Form>
                {/* Name Field */}
                <div className="flex flex-col mb-2">
                  <label className="text-sm font-semibold">Name</label>
                  <Field
                    name="name"
                    placeholder="Enter name"
                    className="border rounded-lg px-4 py-2 mt-1"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Country Dropdown */}
                <Field name="country">
                  {({ field, form }: any) => (
                    <div className="flex flex-col mb-2">
                      <label
                        htmlFor="country"
                        className="text-sm font-semibold"
                      >
                        Country
                      </label>
                      <Select
                        inputId="country"
                        options={countryOptions}
                        isClearable
                        placeholder="Select country..."
                        value={
                          field.value
                            ? { value: field.value, label: field.value }
                            : null
                        }
                        onChange={async (option) => {
                          const country = option?.value || "";
                          form.setFieldValue("country", country);

                          if (country === "INDIA") {
                            await fetchStates();
                          } else {
                            setStates([]);
                            setCities([]);
                            form.setFieldValue("state", "");
                            form.setFieldValue("city", "");
                          }
                        }}
                        onBlur={() => form.setFieldTouched("country", true)}
                        classNamePrefix="react-select"
                      />
                      <ErrorMessage
                        name="country"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  )}
                </Field>

                {values.country !== "INDIA" && (
                  <div className="flex flex-col mb-2">
                    <label className="text-sm font-semibold">City</label>
                    <Field
                      name="city"
                      placeholder="Enter City"
                      className="border rounded-lg px-4 py-2 mt-1"
                    />
                    <ErrorMessage
                      name="city"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                )}

                {/* State Dropdown */}
                {values.country === "INDIA" && (
                  <div className="flex flex-col mb-2">
                    <label className="text-sm font-semibold">State</label>
                    <Field
                      as="select"
                      name="state"
                      className="border rounded-lg px-4 py-2 mt-1"
                      onChange={async (
                        e: React.ChangeEvent<HTMLSelectElement>
                      ) => {
                        setFieldValue("state", e.target.value);
                        await fetchCities(e.target.value);
                        setFieldValue("city", "");
                      }}
                    >
                      <option value="" label="Select state" />
                      {states.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </Field>
                  </div>
                )}

                {/* City Dropdown */}
                {values.country === "INDIA" && values.state && (
                  <div className="flex flex-col mb-2">
                    <label className="text-sm font-semibold">City</label>
                    <Field
                      as="select"
                      name="city"
                      className="border rounded-lg px-4 py-2 mt-1"
                    >
                      <option value="" label="Select city" />
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Field>
                  </div>
                )}

                {/* File Upload */}
                <div className="flex flex-col mb-2">
                  <label className="text-sm font-semibold">College Image</label>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-24 h-24 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                      {previewUrl ? (
                        isImageUrl(previewUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="College"
                            className="object-cover w-full h-full"
                          />
                        ) : isPdfUrl(previewUrl) ? (
                          <div className="flex flex-col items-center justify-center p-2">
                            <img src="/dummy.png" alt="pdf" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">File</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, "img", setFieldValue);
                          }
                        }}
                        accept=".pdf, .jpg, .jpeg, .png"
                        className="border rounded-lg px-4 py-2"
                        disabled={loadingUpload}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {loadingUpload
                          ? "Uploading..."
                          : "Accepted: images, PDF"}
                      </div>

                      {/* If preview is PDF, show a link to open it */}
                      {previewUrl && isPdfUrl(previewUrl) && (
                        <div className="mt-2">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline"
                          >
                            View PDF
                          </a>
                        </div>
                      )}

                      <ErrorMessage
                        name="img"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Description as Textarea */}
                <div className="flex flex-col mb-2">
                  <label className="text-sm font-semibold">Description</label>
                  <Field
                    as="textarea"
                    name="desc"
                    placeholder="Enter Description"
                    className="border rounded-lg px-4 py-2 mt-1 resize-none"
                  />
                </div>

                <div className="flex flex-col mb-2">
                  <label className="text-sm font-semibold">Website</label>
                  <Field
                    name="website"
                    placeholder="https://..."
                    className="border rounded-lg px-4 py-2 mt-1 resize-none"
                  />
                </div>

                {/* Sliding Toggle for Publish on Website */}
                <div className="flex items-center mb-2">
                  <label
                    htmlFor="publish"
                    className="flex items-center cursor-pointer"
                  >
                    <div className="relative">
                      <Field
                        id="publish"
                        type="checkbox"
                        name="publish"
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-deepblue transition-colors duration-200"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 peer-checked:translate-x-6"></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Publish on Website
                    </span>
                  </label>
                </div>

                {/* Sliding Toggle for Top University on Website */}
                <div className="flex items-center mb-2">
                  <label
                    htmlFor="top"
                    className="flex items-center cursor-pointer"
                  >
                    <div className="relative">
                      <Field
                        id="top"
                        type="checkbox"
                        name="top"
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-deepblue transition-colors duration-200"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 peer-checked:translate-x-6"></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Mark as top university
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    type="submit"
                    className="bg-deepblue text-white px-4 py-2 rounded-lg"
                  >
                    {college ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                    onClick={() => {
                      resetForm({
                        values: {
                          name: "",
                          country: "",
                          state: "",
                          city: "",
                          img: "",
                          desc: "",
                          publish: false,
                          _id: "",
                          top: false,
                          website: "",
                        },
                      });
                      onClose();
                      setStates([]);
                      setCities([]);
                      setPreviewUrl("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default CollegeModal;
