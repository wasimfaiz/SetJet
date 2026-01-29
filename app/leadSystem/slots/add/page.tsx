"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "../../../components/loader";
import apiClient from "../../../utils/apiClient";
import RouteGuard from "../../../components/routegaurd";

type CourseType = "IELTS" | "IELTS_DEMO" | "GERMAN" | "GERMAN_DEMO";
type GermanBatch = "A1" | "A2" | "B1";
type Slot = { date: Date; timeSlot: string };

export default function AddSlotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<CourseType>("IELTS");
  const [batchLevel, setBatchLevel] = useState<GermanBatch>("A1");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlot, setTimeSlot] = useState("");

  const [timeInput, setTimeInput] = useState("07:00");
  

  const timeOptions = [
    "07:00 am to 08:30 am", "08:00 am to 09:30 am", "10:00 am to 11:30 am",
    "02:30 pm to 04:00 pm", "06:00 pm to 07:30 pm", "06:30 pm to 08:00 pm",
    "07:00 pm to 08:30 pm", "07:00 pm to 09:00 pm", "07:30 pm to 09:00 pm",
    "08:00 pm to 09:30 pm", "08:30 pm to 10:00 pm", "09:00 pm to 10:30 pm",
    "10:00 pm to 11:30 pm", "08:00 pm to 08:45 pm", "07:00 pm to 07:45 pm",
    "09:00 pm to 10:00 pm"
  ];

  const requiresBatchLevel = course === "GERMAN" || course === "GERMAN_DEMO";

  // Add single date
  const addDate = (date: Date) => {
    if (!selectedDates.find((d) => d.toDateString() === date.toDateString())) {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Remove date from selection
  const removeDate = (date: Date) => {
    setSelectedDates(selectedDates.filter((d) => d.toDateString() !== date.toDateString()));
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedDates([]);
    setTimeSlot("");
  };

  // Generate slots from current selections
  const generateSlots = (): Slot[] => {
    return selectedDates.map((date) => ({ date, timeSlot }));
  };

  // 🔥 NEW: Create BATCH + SLOTS together
  const handleAdd = async () => {
    if (selectedDates.length === 0 || !timeSlot) {
      alert("Please select at least one date and a time slot");
      return;
    }

    const slots = generateSlots();
    
    // ✅ Generate batch name automatically
    const batchName = `${course.replace("_", " ")}${
  requiresBatchLevel ? ` ${batchLevel}` : ""
} - ${format(new Date(), "MMM dd")}`;
    const classType = "Online"; // Default
    const capacity = 25; // Default

    console.log("🚀 Creating batch + slots:", { batchName, course, batchLevel, slots });

    setLoading(true);
    try {
      // 🔥 ONE API CALL creates BOTH batch + slots
    const response = await apiClient.post("/api/scheduling", { 
  // Batch details (auto-created)
  batch: {
    name: batchName,
    course: course,
    classType: classType,
    capacity: capacity,
  },
  // Slots for this batch
  slots: slots.map((slot) => ({
    date: format(slot.date, "yyyy-MM-dd"),
    timeSlot: slot.timeSlot,
  })),
});

      console.log("✅ Batch + Slots created:", response.data);
      alert(`✅ New batch "${batchName}" created with ${slots.length} slots!`);
      router.push("/coachingSystem/batch");
    } catch (err: any) {
      console.error("❌ Error:", err.response?.data);
      alert(err.response?.data?.error || "Failed to create batch + slots");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard requiredPermission="slots">
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-5 mb-8">
            <button
              onClick={() => router.back()}
              className="p-4 bg-white rounded-full shadow-lg"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6" />
            </button>
            <h1 className="text-4xl font-bold text-deepblue flex items-center gap-4">
              <FontAwesomeIcon icon={faClock} className="text-5xl" />
              Create Batch + Slots
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10">
            {/* Course Selection */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-deepblue mb-6">Select Course</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
                <button
                  onClick={() => setCourse("IELTS")}
                  className={`py-6 rounded-2xl font-bold text-xl border-4 transition-all ${
                    course === "IELTS"
                      ? "bg-blue-600 text-white border-blue-800 shadow-xl"
                      : "bg-blue-50 text-blue-700 border-blue-300"
                  }`}
                >
                  IELTS
                </button>
                <button
                  onClick={() => setCourse("IELTS_DEMO")}
                  className={`py-6 rounded-2xl font-bold text-xl border-4 transition-all ${
                    course === "IELTS_DEMO"
                      ? "bg-indigo-600 text-white border-indigo-800 shadow-xl"
                      : "bg-indigo-50 text-indigo-700 border-indigo-300"
                  }`}
                >
                  IELTS DEMO
                </button>
                <button
                  onClick={() => setCourse("GERMAN")}
                  className={`py-6 rounded-2xl font-bold text-xl border-4 transition-all ${
                    course === "GERMAN"
                      ? "bg-green-600 text-white border-green-800 shadow-xl"
                      : "bg-green-50 text-green-700 border-green-300"
                  }`}
                >
                  GERMAN
                </button>
                <button
                  onClick={() => setCourse("GERMAN_DEMO")}
                  className={`py-6 rounded-2xl font-bold text-xl border-4 transition-all ${
                    course === "GERMAN_DEMO"
                      ? "bg-purple-600 text-white border-purple-800 shadow-xl"
                      : "bg-purple-50 text-purple-700 border-purple-300"
                  }`}
                >
                  GERMAN DEMO
                </button>
              </div>
            </div>

            {/* German Level */}
            {requiresBatchLevel && (
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-deepblue mb-6">Select Level</h3>
                <div className="flex gap-4 flex-wrap">
                  {(["A1", "A2", "B1"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setBatchLevel(level)}
                      className={`px-8 py-4 rounded-xl font-bold text-lg border-4 transition-all ${
                        batchLevel === level
                          ? "bg-deepblue text-white border-blue-900"
                          : "bg-gray-100 text-deepblue border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Batch Name */}
            <div className="mb-10 p-6 bg-blue-50 border-4 border-blue-200 rounded-2xl">
              <h3 className="text-xl font-bold text-deepblue mb-2">New Batch Will Be:</h3>
              <p className="text-2xl font-bold text-blue-800">
                {course.replace("_", " ")}{requiresBatchLevel && ` ${batchLevel}`} - {format(new Date(), "MMM dd")}
              </p>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-deepblue">
                    Pick Dates ({selectedDates.length})
                  </h3>
                  {selectedDates.length > 0 && (
                    <button
                      onClick={() => setSelectedDates([])}
                      className="text-red-600 hover:text-red-800 font-bold text-sm"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <Calendar
                  onChange={(v) => addDate(v as Date)}
                  value={selectedDates.length > 0 ? selectedDates[0] : undefined}
                  minDate={new Date()}
                  selectRange={false}
                  className="rounded-2xl border-4 border-gray-200 shadow-xl"
                  tileClassName={({ date }) =>
                    selectedDates.find((d) => d.toDateString() === date.toDateString())
                      ? "bg-blue-500 text-white rounded-full"
                      : ""
                  }
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-deepblue mb-6">Choose Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  {timeOptions.map((time) => (
                    <button
                      key={time}
                      onClick={() => setTimeSlot(time)}
                      className={`py-5 px-6 rounded-xl font-medium text-lg border-4 transition-all ${
                        timeSlot === time
                          ? "bg-deepblue text-white border-blue-900 shadow-xl"
                          : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Slots */}
            {selectedDates.length > 0 && timeSlot && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-emerald-800">
                    Preview ({selectedDates.length} slots)
                  </h3>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Clear All
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generateSlots().map((slot, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-4 border-emerald-300 flex justify-between items-start"
                    >
                      <div>
                        <p className="text-2xl font-bold text-deepblue">
                          {format(slot.date, "do MMMM yyyy")} · {slot.timeSlot}
                        </p>
                        <p className="text-lg mt-1">
                          New Batch: <strong>{course.replace("_", " ")}{requiresBatchLevel && ` ${batchLevel}`}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => removeDate(slot.date)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-6">
              <button
                onClick={() => router.back()}
                className="px-10 py-4 border-2 border-gray-400 rounded-xl font-bold text-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={loading || selectedDates.length === 0 || !timeSlot}
                className={`px-12 py-5 rounded-xl font-bold text-xl text-white flex items-center gap-3 transition-all shadow-2xl ${
                  selectedDates.length > 0 && timeSlot
                    ? "bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-700 hover:to-emerald-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Create Batch + {selectedDates.length} Slot{selectedDates.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
