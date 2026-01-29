"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/app/components/loader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faTrash } from "@fortawesome/free-solid-svg-icons";
import { uploadS3File } from "@/app/utils/methods";

// CV Templates
import TemplateOne from "../Templates/TemplateOne";
import TemplateTwo from "../Templates/TemplateTwo";
import TemplateThree from "../Templates/TemplateThree";
import TemplateFour from "../Templates/TemplateFour";

interface Application {
  _id: string;
  userId: string;
  serviceName: string;
  serviceId: string;
  formSubmitted: boolean;
  formData: Record<string, any> | null;
  formSchemaVersion: string | null;
  payment: {
    status: string;
    transactionId: string;
    amount: number;
    paidAt: string;
    merchantOrderId: string;
    phonepeOrderId: string;
  };
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  videoAttachments?: string[]; // ← Now an array
}

const renderTemplate = (
  id: number,
  formData: any,
  selectedColor: string
): JSX.Element => {
  switch (id) {
    case 1:
      return <TemplateOne formData={formData} selectedColor={selectedColor} />;
    case 2:
      return <TemplateTwo formData={formData} selectedColor={selectedColor} />;
    case 3:
      return (
        <TemplateThree formData={formData} selectedColor={selectedColor} />
      );
    case 4:
      return <TemplateFour formData={formData} selectedColor={selectedColor} />;
    default:
      return <p className="text-gray-500">Invalid template selected</p>;
  }
};

const MAX_VIDEOS = 1000;

export default function ApplicationView() {
  const { id } = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>("#1E40AF");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  const getToken = () => localStorage.getItem("token") || "";

  // Fetch application
  useEffect(() => {
    async function fetchApplication() {
      try {
        const token = getToken();
        const res = await axios.get(`/api/application?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const appData = res.data;

        if (!appData) {
          setApplication(null);
          return;
        }

        // ✅ Flatten step-based formData (if available)
        const flattenedFormData = {
          ...(appData.formData?.step1 || {}),
          ...(appData.formData?.step2 || {}),
          ...(appData.formData?.step3 || {}),
          ...(appData.formData?.step4 || {}),
          ...(appData.formData?.step5 || {}),
          ...(appData.formData?.step6 || {}),
        };

        const TemplateId = appData.formData?.step6?.cvTemplate?.templateId || 1;
        setSelectedTemplate(TemplateId);

        setApplication({
          ...appData,
          formData:
            Object.keys(flattenedFormData).length > 0
              ? flattenedFormData
              : appData.formData,
          videoAttachments: appData.videoAttachments || [],
        });

        // ✅ Load saved template/color
        if (appData?.metadata?.templateId)
          setSelectedTemplate(appData.metadata.templateId);
        if (appData?.metadata?.selectedColor)
          setSelectedColor(appData.metadata.selectedColor);
      } catch (error) {
        console.error("Error fetching application:", error);
        setError("Failed to load application. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchApplication();
  }, [id]);

  // Load all video URLs when application loads or changes
  useEffect(() => {
    if (!application || application.payment?.status !== "PAID") {
      setVideoUrls({});
      return;
    }

    const keys = application.videoAttachments || [];
    const missing = keys.filter((key) => !videoUrls[key]);

    if (missing.length === 0) return;

    (async () => {
      const token = getToken();
      const newUrls: Record<string, string> = {};

      for (const key of missing) {
        try {
          const res = await axios.get(`/api/get-video?key=${key}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          newUrls[key] = res.data.url;
        } catch (e) {
          console.error("Failed to load video:", key);
        }
      }

      setVideoUrls((prev) => ({ ...prev, ...newUrls }));
    })();
  }, [application]);

  // 🧩 Update template dynamically
  const handleTemplateChange = async (templateId: number) => {
    setSelectedTemplate(templateId);
    try {
      const token = getToken();
      await axios.put(
        `/api/application/${id}/updateTemplate`,
        { templateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to update template:", error);
      setError("Failed to update template.");
    }
  };

  // ✏️ Edit redirect
  const handleEdit = () => {
    router.push(`/leadSystem/application/${id}/edit`);
  };

  // 📄 Download PDF

  const handleDownloadPDF = async () => {
    const token = localStorage.getItem("token");
    const id = "68fa81f96a8f7c1dd985b9fd"; // your CV/application ID

    if (!token) return alert("You must be logged in to download the CV");

    // Open the API in a new tab (triggers download)
    window.open(`/api/pdf/cv?id=${id}&token=${token}`, "_blank");
  };

  // Upload multiple videos
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = application?.videoAttachments?.length || 0;
    const allowed = MAX_VIDEOS - currentCount;
    if (files.length > allowed) {
      setError(`You can only upload ${allowed} more video(s).`);
      return;
    }

    if (application?.payment?.status !== "PAID") {
      setError("Payment required to upload videos.");
      return;
    }

    setError(null);
    setUploadingVideo(true);

    const uploadedKeys: string[] = [];
    const newUrls: Record<string, string> = { ...videoUrls };

    try {
      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          setError(`${file.name} exceeds 100MB limit.`);
          continue;
        }

        const key = await uploadS3File(file, "videos", true); // Upload to private bucket
        if (!key) throw new Error(`Failed to upload ${file.name}`);

        uploadedKeys.push(key);

        const token = getToken();
        const res = await axios.get(`/api/get-video?key=${key}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        newUrls[key] = res.data.url;
      }

      const token = getToken();
      const updated = [
        ...(application?.videoAttachments || []),
        ...uploadedKeys,
      ];

      await axios.put(
        `/api/application?id=${id}`,
        { videoAttachments: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApplication((prev) =>
        prev ? { ...prev, videoAttachments: updated } : null
      );
      setVideoUrls((prev) => ({ ...prev, ...newUrls }));
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Upload failed. Try again.");
    } finally {
      setUploadingVideo(false);
    }
  };

  // Delete a video
  const handleDeleteVideo = async (keyToDelete: string) => {
    if (!confirm("Delete this video permanently?")) return;

    setDeleting(keyToDelete);

    try {
      const token = getToken();
      const updated = (application?.videoAttachments || []).filter(
        (k) => k !== keyToDelete
      );

      await axios.put(
        `/api/application?id=${id}`,
        { videoAttachments: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApplication((prev) =>
        prev ? { ...prev, videoAttachments: updated } : null
      );
      setVideoUrls((prev) => {
        const { [keyToDelete]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error(error);
      setError("Failed to delete video.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!application) {
    return <p className="text-center text-gray-600">No application found.</p>;
  }

  const isPaid = application.payment?.status === "PAID";
  const videoCount = application.videoAttachments?.length || 0;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Back + Edit Buttons */}
      <div className="flex justify-between mb-6">
        <button onClick={() => router.back()} className="text-deepblue">
          Back
        </button>
        <button
          onClick={handleEdit}
          className="text-deepblue underline font-semibold"
        >
          {" "}
          ✎ Edit
        </button>
      </div>

      <h1 className="mb-8 text-4xl font-extrabold text-gray-900">
        Application Overview
      </h1>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 mb-5">
          {error}
        </div>
      )}

      {/* General Info */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {application.serviceName}
          </h2>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              application.status === "SUBMITTED"
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {application.status}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-gray-700">
          <p>
            <span className="font-medium">Application ID:</span>{" "}
            {application._id}
          </p>
          <p>
            <span className="font-medium">User ID:</span> {application.userId}
          </p>
          <p>
            <span className="font-medium">Form Submitted:</span>{" "}
            {application.formSubmitted ? "✅ Yes" : " ❌ No"}
          </p>
          <p>
            <span className="font-medium">Created At:</span>{" "}
            {new Date(application.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Updated At:</span>{" "}
            {new Date(application.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment Section */}
      {application.payment && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💳 Payment</h3>
          <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-gray-700">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <strong className={isPaid ? "text-green-600" : "text-red-600"}>
                {application.payment.status}
              </strong>
            </p>
            <p>
              <span className="font-medium">Amount:</span> ₹
              {application.payment.amount}
            </p>
            <p>
              <span className="font-medium">Transaction ID:</span>{" "}
              {application.payment.transactionId}
            </p>
            <p>
              <span className="font-medium">Paid At:</span>{" "}
              {new Date(application.payment.paidAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Video Section (APS or Visa) */}
      {(application.serviceName === "APS" ||
        application.serviceName === "Visa") && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Video Attachments ({videoCount}/{MAX_VIDEOS})
          </h3>

          {/* Upload Area */}
          <div
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition mb-6 ${
              uploadingVideo || !isPaid || videoCount >= MAX_VIDEOS
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30"
            }`}
          >
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingVideo || !isPaid || videoCount >= MAX_VIDEOS}
            />
            <FontAwesomeIcon
              icon={faVideo}
              className="w-10 h-10 text-gray-400 mb-2"
            />
            <p className="text-sm text-gray-600">
              {uploadingVideo ? (
                <span className="text-blue-500 font-medium">
                  Uploading videos...
                </span>
              ) : !isPaid ? (
                <span className="text-red-600">Payment required</span>
              ) : videoCount >= MAX_VIDEOS ? (
                <span className="text-gray-500">
                  Max {MAX_VIDEOS} videos reached
                </span>
              ) : (
                <>
                  <span className="font-semibold text-indigo-600">
                    Click or drop videos
                  </span>{" "}
                  (max {MAX_VIDEOS})
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              MP4, AVI, MOV (max 100MB each)
            </p>
          </div>

          {/* Uploaded Videos Grid */}
          {application.videoAttachments &&
            application.videoAttachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {application.videoAttachments.map((key) => (
                  <div key={key} className="relative group">
                    <video
                      controls
                      src={videoUrls[key] || ""}
                      className="w-full h-48 object-cover rounded-lg shadow"
                      onError={() => console.error("Video failed:", key)}
                    >
                      Your browser does not support the video tag.
                    </video>

                    <button
                      onClick={() => handleDeleteVideo(key)}
                      disabled={deleting === key}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 disabled:opacity-50"
                      title="Delete video"
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        className={`w-4 h-4 ${
                          deleting === key ? "animate-spin" : ""
                        }`}
                      />
                    </button>

                    {!videoUrls[key] && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-sm">Loading...</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Empty state */}
          {isPaid && videoCount === 0 && (
            <p className="text-center text-gray-500 italic">
              No videos uploaded yet.
            </p>
          )}

          {/* Not paid */}
          {!isPaid && (
            <p className="text-center text-red-600 font-medium">
              Complete payment to upload and view videos.
            </p>
          )}
        </div>
      )}

      {/* CV Section */}
      {application.serviceName === "CV" && application.formData && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📄 CV Form</h3>
          <div
            id="CV"
            className="bg-white"
            style={{
              width: "210mm",
              margin: 0,
              padding: 0,
              overflow: "visible", // Critical
              display: "block",
            }}
          >
            {renderTemplate(
              selectedTemplate,
              application.formData,
              selectedColor
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 rounded-lg bg-deepblue text-white font-semibold hover:bg-naranga transition"
            >
              Download CV as PDF
            </button>
          </div>
        </div>
      )}

      {/* Non-CV Form Data */}
      {application.serviceName !== "CV" && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Form Data</h3>
          {application.formData &&
          Object.keys(application.formData).length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 border overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <tbody>
                  {Object.entries(application.formData).map(([key, value]) => (
                    <tr key={key} className="border-b hover:bg-gray-100">
                      <td className="py-2 pr-6 font-semibold">{key}</td>
                      <td className="py-2">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 italic">No form data available.</p>
          )}
        </div>
      )}
    </div>
  );
}
