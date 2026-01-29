// app/coachingSystem/batch/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/app/utils/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";

type ScheduleEntry = {
  day: string;
  time: string;
};

type Batch = {
  _id: string;
  name: string;
  faculty: { id: string; name: string } | null;
  classType: "online" | "offline" | "hybrid";
  capacity: number;
  schedule: ScheduleEntry[];
};

export default function ViewBatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<Batch[]>(`/api/batch?id=${id}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setBatch(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load batch.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = () => {
    router.push(`/coachingSystem/batch/add?id=${id}`);
  };

  if (loading) return <Loader />;
  if (error) return <p className="container p-6 text-red-600">{error}</p>;
  if (!batch) return <p className="container p-6">No batch found.</p>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Edit
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h1 className="text-2xl font-semibold">{batch.name}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Faculty:</span>{" "}
            {batch.faculty?.name ?? "—"}
          </div>
          <div>
            <span className="font-medium">Class Type:</span>{" "}
            {batch.classType.charAt(0).toUpperCase() + batch.classType.slice(1)}
          </div>
          <div>
            <span className="font-medium">Capacity:</span> {batch.capacity}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Schedule</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border px-3 py-2 text-left">Day</th>
                <th className="border px-3 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {batch.schedule.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border px-3 py-2 text-sm">{row.day}</td>
                  <td className="border px-3 py-2 text-sm">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
