// components/TaskModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";

interface DatabaseModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    desc?: string,
    priority?: string,
    imageUrl?: string
  ) => void;
  name: string;
  defaultValue?: string;
  defaultDesc?: string;
  defaultPriority?: string;
  defaultImg?: string;
}

const TaskModal: React.FC<DatabaseModalProps> = ({
  show,
  onClose,
  onSave,
  name,
  defaultValue = "",
  defaultDesc = "",
  defaultPriority = "MEDIUM",
  defaultImg = "",
}) => {
  const formikRef = React.useRef<any>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultImg || "");
  console.log(defaultImg);

  useEffect(() => {
    if (show) {
      formikRef.current?.resetForm({
        values: {
          name: defaultValue,
          desc: defaultDesc,
          priority: defaultPriority,
          image: defaultImg || "",
        },
      });
      setPreviewUrl(defaultImg || "");
    }
  }, [show, defaultValue, defaultDesc, defaultPriority, defaultImg]);

  if (!show) return null;

  // helpers to detect file type from URL
  const isImageUrl = (url: string) =>
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

  const handleFileUpload = async (
    file: File,
    formFieldName: string,
    setFieldValue: (f: string, v: any) => void,
    folderNameFromConfig?: string
  ) => {
    setLoadingUpload(true);
    const folder =
      folderNameFromConfig || file.name.split(".").pop() || "files";

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

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-center mb-4">
          {defaultValue ? `Edit ${name}` : `Enter ${name}`}
        </h2>

        <Formik
          innerRef={formikRef}
          initialValues={{
            name: defaultValue,
            desc: defaultDesc,
            priority: defaultPriority,
            image: defaultImg || "",
          }}
          validationSchema={Yup.object({
            name: Yup.string().required(`${name} name is required`),
            desc: Yup.string(),
            priority: Yup.string().oneOf(
              ["HIGH", "MEDIUM", "LOW"],
              "Invalid priority value"
            ),
          })}
          onSubmit={(values) => {
            onSave(values.name, values.desc, values.priority, values.image);
            onClose();
          }}
        >
          {({ setFieldValue, values }) => (
            <Form>
              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue">
                  {name} Name
                </label>
                <Field
                  name="name"
                  placeholder={`Enter ${name} name`}
                  className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue">
                  Description
                </label>
                <Field
                  as="textarea"
                  name="desc"
                  placeholder={`Enter ${name} description`}
                  className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none resize-none h-24"
                />
                <ErrorMessage
                  name="desc"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue">
                  Priority
                </label>
                <Field
                  as="select"
                  name="priority"
                  className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </Field>
                <ErrorMessage
                  name="priority"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* File uploader (images + PDF) */}
              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue mb-2">
                  {previewUrl ? "File Preview" : "Upload File (Image or PDF)"}
                </label>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-20 h-20 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      isImageUrl(previewUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="object-cover w-full h-full"
                        />
                      ) : isPdfUrl(previewUrl) ? (
                        <div className="flex flex-col items-center justify-center p-2">
                          <img src="/dummy.png" />
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
                      id="fileInput"
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={loadingUpload}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (!file) return;
                        handleFileUpload(file, "image", setFieldValue);
                      }}
                      className="text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {loadingUpload ? "Uploading..." : "Accepted: images, PDF"}
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

                    <Field type="hidden" name="image" />
                    <ErrorMessage
                      name="image"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  disabled={loadingUpload}
                  className={`${
                    loadingUpload ? "opacity-60 cursor-not-allowed" : ""
                  } bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white py-2 px-4 rounded-lg`}
                >
                  {defaultValue ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default TaskModal;
