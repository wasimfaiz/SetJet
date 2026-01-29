"use client";
import { useEffect, useMemo, useState } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faClock } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";

type CourseFilter = "ALL" | "IELTS" | "IELTS_DEMO" | "GERMAN" | "GERMAN_DEMO";

const columns = [
  {
    header: "Course",
    accessor: "course",
    render: (item: any) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          item.course.includes("IELTS")
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {item.course.replace("_", " ")}
      </span>
    ),
  },
  { header: "Date", accessor: "date", type: "date" },
  { header: "Time Slot", accessor: "timeSlot" },
  {
    header: "Batch",
    accessor: "batch",
    render: (item: any) => (
      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
        {item.batch ? "✅ Linked" : "No Batch"}
      </span>
    ),
  },
  {
    header: "Status",
    accessor: "isActive",
    render: (item: any) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.isActive
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {item.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const SlotPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeCourse, setActiveCourse] = useState<CourseFilter>("ALL");

  // ✅ UPDATED: Single scheduling API
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/scheduling?type=slots");
      setSlots(response.data.slots || response.data || []);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const filteredSlots = useMemo(() => {
    if (activeCourse === "ALL") return slots;
    return slots.filter((s) => s.course === activeCourse);
  }, [slots, activeCourse]);

  // ✅ UPDATED: Single scheduling API
  const handleDelete = async () => {
    if (!selectedSlot) return;

    try {
      await apiClient.delete(`/api/scheduling?id=${selectedSlot._id}&type=slot`);
      setSlots((prev) => prev.filter((s) => s._id !== selectedSlot._id));
      setShowDeleteModal(false);
      setSelectedSlot(null);
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert("Failed to delete slot");
    }
  };

  const openDeleteModal = (slot: any) => {
    setSelectedSlot(slot);
    setShowDeleteModal(true);
  };

  const renderActions = (slot: any) =>
    checkButtonVisibility(permissions, "slots", "delete") && (
      <button
        onClick={() => openDeleteModal(slot)}
        className="text-red-600 hover:text-red-800 transition"
        title="Delete Slot"
      >
        <FontAwesomeIcon icon={faTrashCan} className="w-5 h-5" />
      </button>
    );

  if (loading) return <Loader />;

  const canAdd = checkButtonVisibility(permissions, "slots", "add");
  const canDelete = checkButtonVisibility(permissions, "slots", "delete");

  return (
    <RouteGuard requiredPermission="slots">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faClock} className="text-3xl text-deepblue" />
            <h1 className="text-3xl font-bold text-deepblue">Manage Slots</h1>
          </div>

          {canAdd && (
            <Link
              href="/leadSystem/slots/add"
              className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-800 hover:to-parrotgreen text-white font-medium px-8 py-4 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              + Add New Slot
            </Link>
          )}
        </div>

        {/* Course Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          {(["ALL", "IELTS", "IELTS_DEMO", "GERMAN", "GERMAN_DEMO"] as CourseFilter[]).map(
            (c) => (
              <button
                key={c}
                onClick={() => setActiveCourse(c)}
                className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all ${
                  activeCourse === c
                    ? "bg-deepblue text-white border-blue-900 shadow"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {c.replace("_", " ")}
              </button>
            )
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeCourse === "ALL"
                ? "All Time Slots"
                : `${activeCourse.replace("_", " ")} Slots`}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <Table
              data={filteredSlots}
              //@ts-ignore
              columns={columns}
              actions={canDelete ? renderActions : undefined}
              //@ts-ignore
              onRowClick={(item) => router.push(`/leadSystem/slots/${item._id}`)}
            />
          </div>
        </div>

        <DeleteModal
          show={showDeleteModal}
          //@ts-ignore
          title="Delete Slot"
          message={`Are you sure you want to delete the slot for <strong>${selectedSlot?.course?.replace(
            "_",
            " "
          )}</strong> on <strong>${selectedSlot?.date} at ${selectedSlot?.timeSlot}</strong>?`}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>
  );
};

export default SlotPage;
