"use client";
import { useEffect, useState } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faEnvelopeCircleCheck,
  faUserPlus,
  faSyncAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";

import { welcomeEmail } from "@/app/email/welcomeEmail";
import { courseLaunchTemplate } from "@/app/email/courseLaunchTemplate";
import { referralInvitationTemplate } from "@/app/email/referralInvitationTemplate";
import { newsletterOfferTemplate } from "@/app/email/newsletterOfferTemplate";
import { abandonedEnrollmentTemplate } from "@/app/email/abandonedEnrollmentTemplate";
import { reengagementTemplate } from "@/app/email/reengagementTemplate";
import { promotionalCampaignTemplate } from "@/app/email/promotionalCampaignTemplate";

const columns = [
  { header: "Batch Name", accessor: "name" },
  { header: "Course", accessor: "course" },
  { header: "Class Type", accessor: "classType" },
  { header: "Capacity", accessor: "capacity" },
  {
    header: "Faculty",
    accessor: "facultyId",
    render: (item: any) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.facultyId
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800"
        }`}
      >
        {item.facultyId ? "✅ Assigned" : "⏳ Pending"}
      </span>
    ),
  },
];

const BatchPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [data, setData] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");

  // email state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("courseLaunch");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ NEW: Fetch batches AND faculties
  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, facultiesRes] = await Promise.all([
        apiClient.get("/api/scheduling?type=batches"),
      apiClient.get("/api/facultys"), // ✅ Your endpoint name
      ]);
      
      console.log("📋 Batches:", batchesRes.data);
      console.log("👥 Faculties RAW:", facultiesRes.data);

    // ✅ FIXED: Handle different faculty data structures
      let facultyList = [];
      if (facultiesRes.data && facultiesRes.data.faculties) {
      facultyList = facultiesRes.data.faculties; // {faculties: [...]}
      } else if (Array.isArray(facultiesRes.data)) {
      facultyList = facultiesRes.data; // [...]
      } else if (facultiesRes.data && facultiesRes.data.length === undefined) {
        facultyList = [facultiesRes.data]; // Single object
      }
      
      console.log("👥 Faculties FINAL:", facultyList);
      
      setData(batchesRes.data || []);
      setFaculties(facultyList || []);
    } catch (error) {
      console.error("❌ fetchData error:", error);
      setError("Failed to load batches or faculties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ NEW: Assign faculty to batch
  const assignFacultyToBatch = async () => {
    if (!selectedItem || !selectedFaculty) {
      alert("Please select faculty");
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(`/api/scheduling?id=${selectedItem._id}&type=batch`, {
        facultyId: selectedFaculty,
        updatedAt: new Date().toISOString(),
      });
      
      alert(`✅ Faculty assigned to ${selectedItem.name}`);
      
      // Refresh data
      fetchData();
      setAssignModal(false);
      setSelectedFaculty("");
      setSelectedItem(null);
    } catch (error) {
      console.error("Assign faculty error:", error);
      alert("Failed to assign faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: any) => {
    router.push(`/coachingSystem/batch/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/scheduling?id=${selectedItem._id}&type=batch`);
        setData((prev) => prev.filter((item) => item._id !== selectedItem._id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting batch:", error);
      }
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  // ✅ NEW: Open faculty assign modal
  const openAssignModal = (item: any) => {
    setSelectedItem(item);
    setSelectedFaculty("");
    setAssignModal(true);
  };

  // ✅ FIXED: View Slots button added INSIDE renderActions
  const renderActions = (item: any) => (
    <div className="flex items-center gap-2">
      {/* checkbox for bulk */}
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={selectedBatches.includes(item._id)}
        onChange={() => toggleSelectBatch(item._id)}
        title="Select batch for bulk email"
      />
      
      {/* Assign Faculty Button */}
      {!item.facultyId && (
        <button
          className="h-5 w-5 text-green-600 hover:text-green-800"
          onClick={() => openAssignModal(item)}
          title="Assign Faculty"
        >
          <FontAwesomeIcon icon={faUserPlus} />
        </button>
      )}
      
      {/* ✅ FIXED: View Slots Button - NOW INSIDE renderActions */}
      <button
        className="h-5 w-5 text-purple-600 hover:text-purple-800"
        onClick={() => router.push(`/coachingSystem/batch/${item._id}/slots`)}
        title="View Slots"
      >
        <FontAwesomeIcon icon={faClock} />
      </button>
      
      <button
        className="h-5 w-5 text-deepblue"
        onClick={() => handleSendEmail(item)}
        title="Send email to this batch"
      >
        <FontAwesomeIcon icon={faEnvelopeCircleCheck} />
      </button>
      
      {checkButtonVisibility(permissions, "batch", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </div>
  );

  // Bulk selection helpers (unchanged)
  const toggleSelectBatch = (id: string) => {
    setSelectedBatches((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllOnPage = () => {
    const idsOnPage = data.map((b) => b._id);
    setSelectedBatches(idsOnPage);
  };

  const clearAllSelection = () => setSelectedBatches([]);
  const isAllSelectedOnPage = () =>
    data.length > 0 && data.every((b) => selectedBatches.includes(b._id));

  // Email functions (unchanged - simplified)
  const pickTemplateHtml = (templateKey: string, batchName: string) => {
    return `<div>Email for ${batchName}</div>`;
  };

  const handleSendEmail = async (batch: any) => {
    try {
      setSending(true);
      const html = pickTemplateHtml(selectedTemplate, batch.name);
      await apiClient.post("/api/email", {
        batchId: batch._id,
        subject: `Update for batch ${batch.name}`,
        html,
      });
      alert(`Email triggered for batch ${batch.name}`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send batch email");
    } finally {
      setSending(false);
    }
  };

  const sendBulkEmails = async () => {
    // Your existing bulk email logic
    if (!selectedBatches.length) {
      alert("Select at least one batch.");
      return;
    }

    try {
      setSending(true);

      const sendPromises = selectedBatches.map(async (batchId) => {
        try {
          const res = await apiClient.get(`/api/scheduling?type=batches&id=${batchId}`);
          const batch = res.data;

          const html = pickTemplateHtml(selectedTemplate, batch?.name || "Student");

          await apiClient.post("/api/email", {
            batchId,
            subject: `Update for batch ${batch?.name || ""}`,
            html,
          });

          return { batchId, status: "fulfilled" };
        } catch (e: any) {
          return { batchId, status: "rejected", error: e?.message || String(e) };
        }
      });

      const results = await Promise.all(sendPromises);
      const succeeded = results.filter((r: any) => r.status === "fulfilled");
      const failed = results.filter((r: any) => r.status === "rejected");

      alert(
        `Bulk email complete — succeeded: ${succeeded.length}, failed: ${failed.length}`
      );
      if (failed.length) console.error("Bulk batch failures:", failed);

      setShowBulkModal(false);
      setSelectedBatches([]);
    } catch (err) {
      console.error("Bulk batch send error:", err);
      alert("Bulk send failed.");
    } finally {
      setSending(false);
    }
  };

  if (loading && !data.length) return <Loader />;

  return (
    <RouteGuard requiredPermission="batch">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 mt-10 gap-4">
          <div className="md:text-3xl text-lg text-deepblue">Batch ({data.length})</div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end pr-2 md:pr-4">
            {/* ✅ NEW: Refresh Button */}
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-deepblue text-white rounded-lg text-xs flex items-center gap-1"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSyncAlt} className="w-3 h-3" />
              Refresh
            </button>

            <select
              className="border rounded-lg p-2 text-xs md:text-sm"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="courseLaunch">Course Launch</option>
              <option value="welcome">Welcome Email</option>
              <option value="referralInvite">Referral Invite</option>
              <option value="newsletter">Newsletter / Offers</option>
              <option value="abandonedCart">Abandoned Enrollment</option>
              <option value="reengagement">Re-engagement</option>
              <option value="promoCampaign">Promotional Campaign</option>
            </select>

            {/* select all */}
            <label className="flex items-center gap-1 text-xs md:text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isAllSelectedOnPage()}
                onChange={() =>
                  isAllSelectedOnPage() ? clearAllSelection() : selectAllOnPage()
                }
              />
              <span>Select all</span>
            </label>

            {/* bulk button */}
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={!selectedBatches.length}
              className={`px-3 py-2 rounded-lg text-white text-xs md:text-sm ${
                !selectedBatches.length
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-deepblue hover:bg-naranga"
              }`}
            >
              Bulk Email ({selectedBatches.length})
            </button>

            {/* add batch */}
            {checkButtonVisibility(permissions, "batch", "add") && (
              <Link
                href={`/coachingSystem/batch/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Batch
              </Link>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-4 px-4">{error}</p>
        )}

        <div className="my-10 px-2">
          <Table
            data={data}
            columns={columns}
            actions={renderActions}
            handleView={handleView}
          />
        </div>

        {/* Faculty Assignment Modal */}
        {assignModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-deepblue mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faUserPlus} />
                Assign Faculty to Batch
              </h2>
              
      {/* ✅ FIXED Debug */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                Debug: <strong>{faculties.length}</strong> faculties loaded
                <br />
                Sample: {faculties[0]?.basicField?.name || "No name"}
              </div>
              
      {/* Batch info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="font-bold text-lg text-deepblue">{selectedItem.name}</p>
              </div>

      {/* ✅ FIXED Faculty Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Faculty:
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose faculty...</option>
                  {faculties.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>
              {/* ✅ FIXED: Nested structure */}
                      {faculty.basicField?.name || `Faculty ${faculty._id.slice(-4)}`}
                      {faculty.basicField?.subject ? ` (${faculty.basicField.subject})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setAssignModal(false);
                    setSelectedItem(null);
                    setSelectedFaculty("");
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assignFacultyToBatch}
                  disabled={!selectedFaculty || loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Assign Faculty
                </button>
              </div>
            </div>
          </div>
        )}

        <DeleteModal show={showModal} 
        onClose={() => setShowModal(false)} 
        onDelete={handleDelete} />
      </div>
    </RouteGuard>
  );
};

export default BatchPage;
