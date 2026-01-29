"use client";
import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import apiClient from "@/app/utils/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCheckSquare } from "@fortawesome/free-solid-svg-icons";

type Student = { _id: string; name: string };
type Batch = { _id: string; name: string; classType: string; capacity: number; faculty: { id: string; name: string }; schedule: { day: string; time: string }[] };
type AttendanceEntry = { id: string; name: string };
type FormValues = {
  date: string;
  batchId: string;
  slot: string;
  present: AttendanceEntry[];
  absent: AttendanceEntry[];
  batchName?: string;
  faculty?: { id: string; name: string };
};

const AttendanceAdd = () => {
  const router = useRouter();
  const params = useSearchParams();
  const recordId = params.get("id");

  const { register, handleSubmit, control, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { date: "", batchId: "", slot: "", present: [], absent: [] },
  });
  const batchId = useWatch({ control, name: "batchId" });
  const slot = useWatch({ control, name: "slot" });
  const presentIds = watch("present").map(e => e.id);

  const [mounted, setMounted] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchDetail, setBatchDetail] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => setMounted(true), []);

  // load batches
  useEffect(() => {
    apiClient.get<Batch[]>("/api/batch")
      .then(r => setBatches(r.data))
      .catch(console.error);
  }, []);

  // load record for edit
  useEffect(() => {
    if (!recordId) return;
    apiClient.get<FormValues[]>(`/api/attendance?id=${recordId}`)
      .then(r => reset(Array.isArray(r.data) ? r.data[0] : r.data))
      .catch(console.error);
  }, [recordId, reset]);

  // when batch changes, fetch detail
  useEffect(() => {
    if (!batchId) {
      setBatchDetail(null);
      setStudents([]);
      setValue("slot", "");
      return;
    }
    apiClient.get<Batch[]>(`/api/batch?id=${batchId}`)
      .then(r => {
        const b = Array.isArray(r.data) ? r.data[0] : r.data;
        setBatchDetail(b);
        // set branch and faculty in form
        setValue("batchName", b.name);
        setValue("faculty", b.faculty);
      })
      .catch(console.error);
    setValue("slot", "");
    setStudents([]);
  }, [batchId, setValue]);

  // when slot selected, fetch students
  useEffect(() => {
    if (!batchId || !slot) return;
    setLoading(true);
    apiClient.get<Student[]>("/api/students", { params: { batchId, slot } })
      .then(r => setStudents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [batchId, slot]);

  const filtered = useMemo(
    () => students.filter(s => s.name.toLowerCase().includes(searchText.toLowerCase())),
    [students, searchText]
  );

  // toggle all present
  const toggleMarkAll = () => {
    const entries = filtered.map(s => ({ id: s._id, name: s.name }));
    const allMarked = entries.every(e => presentIds.includes(e.id));
    setValue("present", allMarked ? [] : entries);
  };

  const onSubmit = async (data: FormValues) => {
    // compute absentees as entries
    const allEntries = students.map(s => ({ id: s._id, name: s.name }));
    data.absent = allEntries.filter(e => !data.present.some(p => p.id === e.id));
    if(recordId)
    {
      //@ts-ignore
      delete data._id
    }
    try {
      const url = recordId ? `/api/attendance?id=${recordId}` : "/api/attendance";
      const method = recordId ? "PUT" : "POST";
      await apiClient.request({ url, method, data });
      router.push("/coachingSystem/attendance");
    } catch {
      alert("Failed to save attendance");
    }
  };

  if (!mounted) return null;
  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm mb-4">← Back</button>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{recordId ? "Edit" : "Add"} Attendance</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-5 rounded-lg space-y-6">
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <select {...register("batchId", { required: true })} className="mt-1 block w-full p-2 border rounded">
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Type</label>
            <input type="text" value={batchDetail?.classType || ""} disabled className="mt-1 block w-full p-2 border rounded bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input type="text" value={batchDetail?.capacity || ""} disabled className="mt-1 block w-full p-2 border rounded bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Faculty</label>
            <input type="text" value={batchDetail?.faculty.name || ""} disabled className="mt-1 block w-full p-2 border rounded bg-gray-100" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Slot</label>
            <select {...register("slot", { required: true })} className="mt-1 block w-full p-2 border rounded" disabled={!batchDetail}>
              <option value="">Select Slot</option>
              {batchDetail?.schedule.map((s,i) => (
                <option key={i} value={`${s.day}|${s.time}`}>{s.day} @ {s.time}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" {...register("date", { required: true })} className="mt-1 block w-full p-2 border rounded" />
          </div>
        </div>

        {students.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchText} onChange={e=>setSearchText(e.target.value)} className="pl-10 pr-3 py-2 border rounded w-64" />
            </div>
            <button type="button" onClick={toggleMarkAll} className="flex items-center text-green-600">
              <FontAwesomeIcon icon={faCheckSquare} className="mr-2"/>
              {filtered.every(s=> presentIds.includes(s._id)) ? 'Clear All' : 'Mark All Present'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 border rounded bg-gray-50" style={{opacity: loading?0.6:1}}>
          {filtered.map(s=> (
            <label key={s._id} className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-blue-50 transition">
              <input
                  type="checkbox"
                  checked={watch("present").some((e: AttendanceEntry) => e.id === s._id)}
                  onChange={() => {
                    const current = watch("present") as AttendanceEntry[];
                    const exists = current.find(e => e.id === s._id);
                    if (exists) {
                      setValue("present", current.filter(e => e.id !== s._id));
                    } else {
                      setValue("present", [...current, { id: s._id, name: s.name }]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600"
                />
              <span className="text-sm text-gray-800">{s.name}</span>
            </label>
          ))}
          {(!loading && !filtered.length) && <p className="text-gray-500 col-span-full">No students.</p>}
        </div>

        <div>
          <h3 className="text-lg font-medium">Absentees</h3>
          <ul className="list-disc list-inside text-gray-600 mt-2">
            {students.filter(s=>!presentIds.includes(s._id)).map(s=><li key={s._id}>{s.name}</li>)}
            {students.length>0 && presentIds.length===students.length && <li>None</li>}
          </ul>
        </div>

        <div className="text-right">
          <button type="submit" className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-6 py-2 rounded hover:opacity-90">
            Save Attendance
          </button>
        </div>
      </form>
    </div>
  );
}
const AttendancePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceAdd />
    </Suspense>
  );
};

export default AttendancePage;