// app/coachingSystem/batch/[add|edit]/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import apiClient from "@/app/utils/apiClient";

type FacultyOption = { label: string; value: string };
type ScheduleEntry = { day: string; time: string };

interface BatchForm {
  name: string;
  faculty: { id: string; name: string } | null;
  schedule: ScheduleEntry[];
  classType: "online" | "offline" | "hybrid";
  capacity: number;
}

const DAYS = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

const defaultValues: BatchForm = {
  name: "",
  faculty: null,
  schedule: [{ day: "", time: "" }],
  classType: "online",
  capacity: 0,
};

const BatchAddPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const isEdit = Boolean(id);

  const { register, control, handleSubmit, reset, formState:{ errors, isSubmitting } } =
    useForm<BatchForm>({ defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: "schedule" });

  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch faculties
  useEffect(() => {
    apiClient.get<{ _id:string; basicField?:{name:string} }[]>("/api/facultys")
      .then(res => setFaculties(
        res.data.map(f => ({ label: f.basicField?.name || "Unnamed", value: f._id }))
      ))
      .catch(console.error);
  }, []);

  // load existing
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/api/batch?id=${id}`)
      .then(res => {
        const b = Array.isArray(res.data) ? res.data[0] : res.data;
        reset({
          name: b.name,
          faculty: b.faculty || null,
          schedule: Array.isArray(b.schedule) && b.schedule.length
            ? b.schedule.map((s:any)=>({ day:s.day, time:s.time }))
            : defaultValues.schedule,
          classType: b.classType,
          capacity: b.capacity
        });
      })
      .catch(console.error)
      .finally(()=>setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: BatchForm) => {
    try {
      const url = isEdit ? `/api/batch?id=${id}` : "/api/batch";
      const method = isEdit ? "PUT" : "POST";
      // @ts-ignore
      if (isEdit) delete data._id;
      await fetch(url, {
        method, headers: { "Content-Type":"application/json" },
        body: JSON.stringify(data),
      });
      router.push("/coachingSystem/batch");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  if (loading) return <p className="text-center py-10">Loading…</p>;

  return (
    <div className="container my-10 p-6 bg-white rounded-xl shadow-lg">
      <button
        onClick={()=>router.back()}
        className="text-blue-600 hover:underline mb-4"
      >← Back</button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Batch Details */}
        <section className="bg-white p-5 rounded-lg space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block mb-1 font-medium">Name of Batch</label>
              <input
                {...register("name",{ required:"Required" })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                placeholder="Enter batch name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block mb-1 font-medium">Faculty</label>
              <Controller
                control={control}
                name="faculty"
                rules={{ required:"Required" }}
                render={({ field })=>(
                  <select
                    value={field.value?.id||""}
                    onChange={e=>{
                      const sel = faculties.find(f=>f.value===e.target.value);
                      field.onChange(sel ? { id:sel.value, name:sel.label } : null);
                    }}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                  >
                    <option value="">Select faculty</option>
                    {faculties.map(f=>(
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.faculty && <p className="text-red-600 text-sm mt-1">{errors.faculty.message}</p>}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Schedule</h2>
          <div className="space-y-3">
            {fields.map((f, idx)=>(
              <div key={f.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block mb-1 text-sm">Day</label>
                  <select
                    {...register(`schedule.${idx}.day`, { required:true })}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Choose day</option>
                    {DAYS.map(d=>(
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block mb-1 text-sm">Time</label>
                  <input
                    type="time"
                    {...register(`schedule.${idx}.time`, { required:true })}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={()=>remove(idx)}
                  className="text-red-500 hover:text-red-700"
                >✕</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={()=>append({ day:"", time:"" })}
            className="text-blue-600 hover:underline text-sm"
          >+ Add another slot</button>
        </section>

        {/* Settings */}
        <section className="bg-white p-5 rounded-lgspace-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium">Class Type</label>
              <select
                {...register("classType",{ required:true })}
                className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {errors.classType && <p className="text-red-600 text-sm mt-1">Required</p>}
            </div>
            <div>
              <label className="block mb-1 font-medium">Capacity</label>
              <input
                type="number"
                {...register("capacity",{ required:true, min:{ value:1, message:"Min 1" } })}
                className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
                placeholder="e.g. 30"
              />
              {errors.capacity && <p className="text-red-600 text-sm mt-1">{errors.capacity.message}</p>}
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="text-right">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-block bg-gradient-to-r from-blue-900 to-deepblue text-white font-medium px-6 py-2 rounded-lg shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {isEdit ? "Update Batch" : "Create Batch"}
          </button>
        </div>

      </form>
    </div>
  );
}
const BatchPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchAddPage />
    </Suspense>
  );
};

export default BatchPage;