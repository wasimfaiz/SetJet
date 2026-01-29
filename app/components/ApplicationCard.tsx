// file: app/components/ApplicationCard.tsx
"use client";

import React, { ChangeEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faEdit,
  faPlus,
  faTimes,
  faTrash,
  faUpload,
  faDownload,
  faEye,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// --- Types ---
export interface Step {
  remark: any;
  id: string;
  name: string;
  status: "Pending" | "In Progress" | "Completed";
  fileUrl?: string | null;
}

export interface Application {
  id: string;
  name: string;
  steps: Step[];
}

export type Editing = { appId: string; stepId: string } | null;

// status badge colors
const statusColors: Record<Step["status"], string> = {
  Pending: "bg-bloodred",
  "In Progress": "bg-orange-500",
  Completed: "bg-parrotgreen",
};

// --- Props ---
interface AppCardProps {
  application: Application;
  editing: Editing;
  onSetEditing: React.Dispatch<React.SetStateAction<Editing>>;
  onSaveEdit: (appId: string, stepId: string) => void;
  onCancelEdit: () => void;
  onDeleteStep: (appId: string, stepId: string) => void;
  onAddStep: (appId: string) => Promise<Step>;
  handleImage: (appId: string, stepId: string, file: File) => Promise<void>;
  newStepName: string;
  setNewStepName: React.Dispatch<React.SetStateAction<string>>;
  newStepRemark: string;
  setNewStepRemark: React.Dispatch<React.SetStateAction<string>>;
  newStepStatus: Step["status"];
  setNewStepStatus: React.Dispatch<React.SetStateAction<Step["status"]>>;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  onDeleteApplication: (appId: string) => void;
}

const ApplicationCard: React.FC<AppCardProps> = ({
  application: app,
  editing,
  onSetEditing,
  onSaveEdit,
  onCancelEdit,
  onDeleteStep,
  onAddStep,
  handleImage,
  newStepName,
  newStepRemark,
  setNewStepName,
  setNewStepRemark,
  newStepStatus,
  setNewStepStatus,
  setApplications,
  onDeleteApplication,
}) => {
  const [editError, setEditError] = useState<{ name?: string; status?: string }>({});
  const [addError, setAddError] = useState<string>("");
  const [uploadingSteps, setUploadingSteps] = useState<Set<string>>(new Set());

  // Download helper
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

  // Add without file
  const handleAdd = async () => {
    if (!newStepName.trim()) {
      setAddError("Name required");
      return;
    }
    setAddError("");
    try {
      await onAddStep(app.id);
    } catch (err) {
      console.error(err);
      alert("Failed to add step");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{app.name} : {app.id}</h2>
        <button
          onClick={() => onDeleteApplication(app.id)}
          className="bg-red-200 p-2 rounded-lg text-red-600 hover:text-red-800"
        >
          <FontAwesomeIcon icon={faTrash} /> Delete
        </button>
      </div>

      {/* Steps */}
      <div className="relative pl-6">
        {app.steps.map((step, idx) => {
          const isUploading = uploadingSteps.has(step.id);
          return (
            <div key={step.id} className="flex items-start relative mb-8 last:mb-0">
              {idx < app.steps.length - 1 && (
                <div className="absolute left-4 top-8 h-full w-px bg-gray-300" />
              )}
              <div className="w-8 h-8 rounded-full bg-deepblue text-white flex items-center justify-center text-sm font-bold z-10">
                {idx + 1}
              </div>
              <div className="w-full ml-4 flex justify-between gap-2">
                {/* Name */}
                <div>
                  {editing?.appId === app.id && editing?.stepId === step.id ? (
                    <>
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={step.name}
                        onChange={(e) =>
                          setApplications((prev) =>
                            prev.map((a) =>
                              a.id === app.id
                                ? {
                                    ...a,
                                    steps: a.steps.map((s) =>
                                      s.id === step.id
                                        ? { ...s, name: e.target.value }
                                        : s
                                    ),
                                  }
                                : a
                            )
                          )
                        }
                      />
                      {editError.name && (
                        <p className="text-red-500 text-xs mt-1">{editError.name}</p>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium">{step.name}</span>
                  )}
                </div>
                {/* Remark */}
                <div>
                  {editing?.appId === app.id && editing?.stepId === step.id ? (
                    <>
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={step.remark}
                        onChange={(e) =>
                          setApplications((prev) =>
                            prev.map((a) =>
                              a.id === app.id
                                ? {
                                    ...a,
                                    steps: a.steps.map((s) =>
                                      s.id === step.id
                                        ? { ...s, remark: e.target.value }
                                        : s
                                    ),
                                  }
                                : a
                            )
                          )
                        }
                      />
                    </>
                  ) : (
                    <span className="text-sm font-medium">{step.remark}</span>
                  )}
                </div>
                {/* Status */}
                <div>
                  {editing?.appId === app.id && editing?.stepId === step.id ? (
                    <>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={step.status}
                        onChange={(e) =>
                          setApplications((prev) =>
                            prev.map((a) =>
                              a.id === app.id
                                ? {
                                    ...a,
                                    steps: a.steps.map((s) =>
                                      s.id === step.id
                                        ? { ...s, status: e.target.value as Step["status"] }
                                        : s
                                    ),
                                  }
                                : a
                            )
                          )
                        }
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                      {editError.status && (
                        <p className="text-red-500 text-xs mt-1">{editError.status}</p>
                      )}
                    </>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${
                        statusColors[step.status]
                      }`}
                    >
                      {step.status}
                    </span>
                  )}
                </div>

                {/* File upload & thumbnail */}
                <div className="w-24 h-16 flex items-center justify-center relative">
                  {editing?.appId === app.id && editing?.stepId === step.id ? (
                    <div className="flex flex-col items-center space-y-1">
                      <label className="cursor-pointer flex flex-col items-center space-y-1 text-deepblue">
                        {isUploading ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faUpload} />
                        )}
                        <span className="text-xs">
                          {isUploading ? "Uploading…" : "Upload"}
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingSteps((p) => new Set(p).add(step.id));
                            try {
                              await handleImage(app.id, step.id, file);
                            } finally {
                              setUploadingSteps((p) => {
                                const nxt = new Set(p);
                                nxt.delete(step.id);
                                return nxt;
                              });
                            }
                          }}
                        />
                      </label>
                      {/* NEW: always show thumbnail in edit mode if fileUrl is set */}
                      {step.fileUrl && !isUploading && (
                        <img
                          src={step.fileUrl}
                          alt="Step file"
                          className="mt-1 w-16 h-10 object-cover rounded border"
                        />
                      )}
                    </div>
                  ) : step.fileUrl ? (
                    // unchanged: non‐edit mode thumbnail + view/download buttons
                    <div className="relative">
                      <img
                        src={step.fileUrl}
                        alt="Step file"
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 opacity-0 hover:opacity-100 bg-black bg-opacity-25 rounded">
                        <button
                        //@ts-ignore
                          onClick={() => window.open(step.fileUrl, "_blank")}
                          className="text-white text-sm flex items-center space-x-1"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(
                              step.fileUrl!,
                              "image"
                            )
                          }
                          className="text-white text-sm flex items-center space-x-1"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No File</div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex space-x-2 justify-end">
                  {editing?.appId === app.id && editing?.stepId === step.id ? (
                    <>
                      <button
                        onClick={() => {
                          const errs: typeof editError = {};
                          if (!step.name.trim()) errs.name = "Name required";
                          if (!step.status) errs.status = "Status required";
                          setEditError(errs);
                          if (Object.keys(errs).length === 0) {
                            onSaveEdit(app.id, step.id);
                          }
                        }}
                        className="text-parrotgreen"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </button>
                      <button
                        onClick={() => {
                          setEditError({});
                          onCancelEdit();
                        }}
                        className="text-gray-600"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          onSetEditing({ appId: app.id, stepId: step.id })
                        }
                        className="text-gray-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => onDeleteStep(app.id, step.id)}
                        className="text-red-600"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {app.steps.length === 0 && (
          <div className="text-gray-500 text-sm ml-8">No steps defined</div>
        )}
      </div>

      {/* Add New Step */}
      <div className="mt-4 border-t pt-4 ml-8">
        <div className="flex gap-2 items-center justify-between">
          <div className="w-full">
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="New Step Name"
              value={newStepName}
              onChange={(e) => {
                setNewStepName(e.target.value);
                setAddError("");
              }}
            />
            {addError && (
              <p className="text-red-500 text-xs mt-1">{addError}</p>
            )}
          </div>
          <div className="w-full">
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Remark"
              value={newStepRemark}
              onChange={(e) => {
                setNewStepRemark(e.target.value);
                setAddError("");
              }}
            />
            {addError && (
              <p className="text-red-500 text-xs mt-1">{addError}</p>
            )}
          </div>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={newStepStatus}
            onChange={(e) =>
              setNewStepStatus(e.target.value as Step["status"])
            }
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <button
            onClick={handleAdd}
            className="w-full bg-deepblue text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;
