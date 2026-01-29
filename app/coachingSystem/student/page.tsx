"use client";
import React, { Suspense, useEffect, useState, useCallback } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faCalendarCheck, faClock } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";

interface EnhancedStudent { 
  email: string; 
  _id: string; 
  name: string; 
  phoneNumber: string; 
  regDate: string; 
  batches?: any[]; 
  source?: string;
  paymentStatus?: string;
  bookingCount: number;
  bookings: any[];
  sourceDisplay: string;
}

interface Batch {
  _id: string;
  name: string;
  course: string;
  classType: string;
  capacity: number;
}

interface AvailableSlot {
  _id: string;
  batch: string;  // batch._id
  batchInfo: Batch;
  date: string;
  timeSlot: string;
  display: string;
  currentBookings: number;
  maxCapacity: number;
  isBooked: boolean;
}

interface Assignment {
  batchId: string;
  slotId?: string;
  slotInfo?: { date: string; timeSlot: string };
}

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Mobile", accessor: "phoneNumber" },
  { header: "Reg Date", accessor: "regDate" },
  { header: "Bookings", accessor: "bookingCount" },
  { header: "Source", accessor: "sourceDisplay" },
];

const StudentPageContent: React.FC = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [students, setStudents] = useState<EnhancedStudent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<EnhancedStudent | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [studentForAssign, setStudentForAssign] = useState<EnhancedStudent | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get("/api/students");
      const studentsData = resp.data || resp;

      const studentsWithBookings = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const bookingsResp = await apiClient.get(`/api/bookings?studentId=${student._id}`);
            const bookings = bookingsResp.data?.bookings || bookingsResp.data || [];
            return {
              ...student,
              bookingCount: bookings.length,
              bookings: bookings.slice(0, 3),
              sourceDisplay: student.source === "phonepe_payment" ? "PhonePe Auto" :
                            student.source === "application" ? "Application" : "Manual"
            };
          } catch {
            return {
              ...student,
              bookingCount: 0,
              bookings: [],
              sourceDisplay: "Manual"
            };
          }
        })
      );

      setStudents(studentsWithBookings);
    } catch (err) {
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  // ✅ UPDATED: Fetch batches from scheduling API
  const fetchBatches = async () => {
    try {
      const resp = await apiClient.get("/api/scheduling?type=batches");
      setBatches(resp.data || []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  // ✅ UPDATED: Fetch available slots from scheduling API
  useEffect(() => {
    if (assignOpen && selectedBatchIds.length > 0) {
      const fetchSlots = async () => {
        try {
          const batchIds = selectedBatchIds.join(",");
          const resp = await apiClient.get(`/api/scheduling?type=slots`);
          const allSlots: AvailableSlot[] = resp.data?.slots || resp.data || [];
          
          // Filter for selected batches + enhance
          const relevantSlots = allSlots
            .filter(slot => selectedBatchIds.includes(slot.batch))
            .map(slot => ({
              ...slot,
              display: `${slot.date} • ${slot.timeSlot}`,
              currentBookings: 0, // TODO: Add booking count aggregation in API if needed
              maxCapacity: slot.batchInfo?.capacity || 20,
              isBooked: false, // TODO: Check against student bookings
            }))
            .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
          
          setAvailableSlots(relevantSlots);
        } catch (err) {
          console.error("Failed to load slots:", err);
          setAvailableSlots([]);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [assignOpen, selectedBatchIds]);

  const toggleBatch = (id: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setSelectedAssignments(prev => prev.filter(a => a.batchId !== id));
  };

  const toggleSlot = (batchId: string, slot: AvailableSlot) => {
    setSelectedAssignments(prev => {
      const exists = prev.some(a => a.batchId === batchId && a.slotId === slot._id);
      if (exists) {
        return prev.filter(a => !(a.batchId === batchId && a.slotId === slot._id));
      }
      return [
        ...prev,
        {
          batchId,
          slotId: slot._id,
          slotInfo: {
            date: slot.date,
            timeSlot: slot.timeSlot
          }
        }
      ];
    });
  };

  const handleAssign = async () => {
    if (!studentForAssign || selectedAssignments.length === 0) {
      alert("Please select at least one slot");
      return;
    }

    try {
      // Create bookings for selected slots
      const bookingPromises = selectedAssignments.map(async (assignment) => {
        if (!assignment.slotId || !assignment.slotInfo) return;

        const batch = batches.find(b => b._id === assignment.batchId);
        if (!batch) return;

        const bookingPayload = {
          studentId: studentForAssign._id,
          batchId: assignment.batchId,
          course: batch.course,
          slotId: assignment.slotId,
          slotInfo: assignment.slotInfo,
          name: studentForAssign.name,
          phoneNumber: studentForAssign.phoneNumber,
          email: studentForAssign.email || "",
          paymentDetails: {
            method: "BATCH_ASSIGNMENT",
            amount: 0,
            status: "confirmed",
            transactionId: `ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          },
        };

        return apiClient.post("/api/bookings", bookingPayload);
      });

      await Promise.all(bookingPromises.filter(Boolean));
      
      await fetchStudents();
      setAssignOpen(false);
      setSelectedAssignments([]);
      alert(`✅ Assigned ${selectedAssignments.length} slots successfully!`);
      
    } catch (error: any) {
      console.error("Assignment failed:", error);
      alert(`Error: ${error.response?.data?.error || error.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBatches();
    const interval = setInterval(fetchStudents, 30000);
    return () => clearInterval(interval);
  }, [fetchStudents]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const openDelete = (s: EnhancedStudent) => {
    setToDelete(s);
    setShowDeleteModal(true);
  };

  const openAssign = (s: EnhancedStudent) => {
    setStudentForAssign(s);
    setSelectedBatchIds([]);
    setSelectedAssignments([]);
    setAssignOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await apiClient.delete(`/api/students?id=${toDelete._id}`);
    setStudents(prev => prev.filter(s => s._id !== toDelete._id));
    setShowDeleteModal(false);
  };

  const actions = (item: EnhancedStudent) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-1 text-xs">
        {item.bookingCount > 0 ? (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-xs" />
            {item.bookingCount} slot{item.bookingCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-gray-500">No bookings</span>
        )}
      </div>

      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.source === 'phonepe_payment' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {item.sourceDisplay}
      </span>

      {checkButtonVisibility(permissions, "student", "edit") && (
        <button
          onClick={() => openAssign(item)}
          className="underline text-sm hover:no-underline text-blue-600 flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faClock} className="text-xs" />
          Assign Slots
        </button>
      )}

      {checkButtonVisibility(permissions, "student", "delete") && (
        <button
          className="h-5 w-5 text-red-600 hover:text-red-800"
          onClick={() => openDelete(item)}
          title="Delete student"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </div>
  );

  if (loading) return <Loader />;

  return (
    <RouteGuard requiredPermission="student">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Students ({students.length})</h1>
            <p className="text-sm text-gray-600 mt-1">
              Auto-refresh every 30s -  <button onClick={handleRefresh} className="text-blue-600 underline hover:no-underline text-xs">Refresh now</button>
            </p>
          </div>
          
          {checkButtonVisibility(permissions, "student", "add") && (
            <Link
              href="/coachingSystem/student/add"
              className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-green-900 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              + Add Student
            </Link>
          )}
        </div>
        
        {error && <p className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</p>}

        <Table
          data={students}
          columns={columns}
          //@ts-ignore
          actions={actions}
          //@ts-ignore
          handleView={(i: EnhancedStudent) => router.push(`/coachingSystem/student/${i._id}`)}
        />

        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />

        {/* ✅ UPDATED Assign Modal - Slots Only */}
        {assignOpen && studentForAssign && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 sticky top-0 bg-white border-b">
                <h2 className="text-2xl font-bold mb-2">
                  Assign Slots - {studentForAssign.name}
                </h2>
                <p className="text-gray-600">Select available slots from batches</p>
              </div>

              {/* Batch Selection */}
              <div className="p-6 border-b">
                <h3 className="font-semibold mb-4">Filter by Batch ({selectedBatchIds.length} selected)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                  {batches.map(batch => (
                    <label key={batch._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-3 w-5 h-5"
                        checked={selectedBatchIds.includes(batch._id)}
                        onChange={() => toggleBatch(batch._id)}
                      />
                      <div>
                        <div className="font-medium text-sm">{batch.name}</div>
                        <div className="text-xs text-gray-500">{batch.course} -  {batch.capacity} seats</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Available Slots */}
              {selectedBatchIds.length > 0 && availableSlots.length > 0 ? (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">
                      Available Slots ({availableSlots.length})
                    </h4>
                    <span className="text-sm text-gray-500">
                      {selectedAssignments.length} selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {availableSlots.map(slot => {
                      const batch = slot.batchInfo;
                      const isSelected = selectedAssignments.some(a => a.slotId === slot._id);
                      
                      return (
                        <label
                          key={slot._id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <input
                              type="checkbox"
                              className="mr-4 w-5 h-5 mt-0.5 flex-shrink-0"
                              checked={isSelected}
                              onChange={() => toggleSlot(slot.batch, slot)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-lg mb-1">{slot.display}</div>
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  {batch?.name || 'Unknown Batch'}
                                </span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                                  {batch?.course}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Capacity: {slot.currentBookings}/{slot.maxCapacity}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : selectedBatchIds.length > 0 ? (
                <div className="p-8 text-center py-12">
                  <FontAwesomeIcon icon={faClock} className="text-4xl text-gray-300 mx-auto mb-4 block" />
                  <p className="text-gray-500 text-lg font-medium mb-2">No available slots</p>
                  <p className="text-sm text-gray-400">Try selecting different batches or create more slots</p>
                </div>
              ) : null}

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={() => setAssignOpen(false)}
                  className="px-8 py-3 border rounded-xl hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedAssignments.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCalendarCheck} />
                  Assign {selectedAssignments.length} Slot{selectedAssignments.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
};

const StudentPage = () => (
  <Suspense fallback={<div className="p-8 text-center">Loading students...</div>}>
    <StudentPageContent />
  </Suspense>
);

export default StudentPage;