"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/app/components/loader";
import RouteGuard from "@/app/components/routegaurd";
import apiClient from "@/app/utils/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faUserCheck, faUserTimes, faChalkboardTeacher, faEdit } from "@fortawesome/free-solid-svg-icons";

type AttendanceRecord = {
  _id: string;
  date: string;
  batchId: string;
  slot: string;
  present: { _id: string; name: string }[];
  absent: { _id: string; name: string }[];
};

type BatchDetail = { name: string };

export default function AttendanceView() {
  const router = useRouter();
    const { id } = useParams();
  

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [batchName, setBatchName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<AttendanceRecord[]>(`/api/attendance?id=${id}`);
        const rec = Array.isArray(res.data) ? res.data[0] : res.data;
        setRecord(rec);
        // fetch batch name
        const bres = await apiClient.get<BatchDetail[]>(`/api/batch?id=${rec.batchId}`);
        const b = Array.isArray(bres.data) ? bres.data[0] : bres.data;
        setBatchName(b.name);
      } catch (e) {
        console.error(e);
        setError("Failed to load attendance record.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleEdit = () => {
    router.push(`/coachingSystem/attendance/add?id=${id}`);
  };

  if (loading) return <Loader />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!record) return <div className="p-6">Record not found.</div>;

  return (
    <RouteGuard requiredPermission="attendance">
      <div className="container">
        <div className="flex justify-between">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm mb-4">← Back</button>
          <button
            onClick={handleEdit}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit
          </button>
        </div>
        <div className="bg-white p-5 rounded-lg space-y-4">
          <div className="flex items-center text-gray-700">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-2" />
            <span className="font-medium">Batch:</span>&nbsp;{batchName}
          </div>
          <div className="flex items-center text-gray-700">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            <span className="font-medium">Date:</span>&nbsp;{record.date}
          </div>
          <div className="flex items-center text-gray-700">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            <span className="font-medium">Slot:</span>&nbsp;{record.slot}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-green-700 mb-2 flex items-center">
              <FontAwesomeIcon icon={faUserCheck} className="mr-2" />Present ({record.present.length})
            </h2>
            {record.present.length ? (
              <ul className="list-disc list-inside text-gray-800">
                {record.present.map(s => <li key={s._id}>{s.name}</li>)}
              </ul>
            ) : <p className="text-gray-500">None</p>}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-red-700 mb-2 flex items-center">
              <FontAwesomeIcon icon={faUserTimes} className="mr-2" />Absent ({record.absent.length})
            </h2>
            {record.absent.length ? (
              <ul className="list-disc list-inside text-gray-800">
                {record.absent.map(s => <li key={s._id}>{s.name}</li>)}
              </ul>
            ) : <p className="text-gray-500">None</p>}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
