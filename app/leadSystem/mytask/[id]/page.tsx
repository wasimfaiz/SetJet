"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import { formatDateTime } from "@/app/utils/helperFunc";
import apiClient from "@/app/utils/apiClient";

const TaskViewPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTask = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/tasks?id=${id}`);
      setTask(response.data);
    } catch (error) {
      console.error("Error fetching task data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTask(id);
    }
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  if (!task) {
    return (
      <div className="container mx-auto mt-10">
        <button
          className="text-blue-500 underline hover:text-deepblue cursor-pointer mb-4"
          onClick={() => router.back()}
        >
          Back
        </button>
        <p className="text-center text-gray-500">No task found</p>
      </div>
    );
  }
  const fileUrl = task.img || task.image || task.file || "";
  const isImageUrl = (url: string) =>
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);
  return (
    <div className="container mx-auto my-10 p-6">
      <div className="mb-6">
        <button
          className="text-blue-500 underline hover:text-blue-700 mb-2"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        {/* Task Header */}
        <div className="border-b pb-6 mb-8 rounded-lg shadow-sm p-6 relative">
          {/* Background image */}
          <img
            src="/pattern.jpg"
            alt="Background Pattern"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-gray-800">Task Name</h2>
            <p className="text-lg text-gray-600">{task.name || "N/A"}</p>

            <h2 className="text-xl font-semibold text-gray-800 mt-4">
              Description
            </h2>
            <p className="text-sm text-gray-600">
              {task.desc || "No description provided."}
            </p>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Priority</h3>
            <p className="mt-1 text-sm font-semibold">
              {task.priority === "HIGH" && (
                <span className="text-red-500 px-2 py-1 rounded bg-red-100">
                  High
                </span>
              )}
              {task.priority === "MEDIUM" && (
                <span className="text-yellow-500 px-2 py-1 rounded bg-yellow-100">
                  Medium
                </span>
              )}
              {task.priority === "LOW" && (
                <span className="text-green-500 px-2 py-1 rounded bg-green-100">
                  Low
                </span>
              )}
            </p>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1 text-sm font-semibold">{task.status || "N/A"}</p>
          </div>
          {/* Assigned by */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned By</h3>
            <p className="mt-1 text-sm font-semibold">
              {task.by?.employeeName || "N/A"}
            </p>
          </div>
          {/* Assigned To */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
            <p className="mt-1 text-sm font-semibold">
              {task.employee?.name || "N/A"}
            </p>
          </div>
          {/* Assigned At */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned At</h3>
            <p className="mt-1 text-sm">
              {formatDateTime(task.employee?.assignedAt) || "N/A"}
            </p>
          </div>
          {/* Status Updated At */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Status Updated At
            </h3>
            <p className="mt-1 text-sm">
              {formatDateTime(task.statusUpdatedAt) || "N/A"}
            </p>
          </div>

          {/* Remark */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Remark</h3>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {task.remark || "No remarks available."}
            </p>
          </div>

          {/* Comment */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Comment</h3>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {task.comment || "No comments available."}
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Document</h3>
            {fileUrl ? (
              isImageUrl(fileUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={fileUrl}
                    alt="task-file"
                    className="object-cover w-full h-full"
                  />
                </a>
              ) : isPdfUrl(fileUrl) ? (
                <div className="flex flex-col p-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col justify-center p-2">
                      {/* thumbnail / icon */}
                      <img
                        className="w-20 h-20"
                        src="/dummy.png"
                        alt="pdf icon"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700">
                        PDF File
                      </div>
                      <div className="text-xs text-gray-500">
                        Click below to view or download
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                    >
                      View PDF
                    </a>
                    <a
                      href={fileUrl}
                      download
                      className="inline-block text-sm bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400">File</span>
              )
            ) : (
              <span className="text-xs text-gray-400">No file</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskViewPage;
