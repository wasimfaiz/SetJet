"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import apiClient from "@/app/utils/apiClient";

type Student = {
  _id: string;
  name: string;
  batches: { id: string; name: string; schedules: { day: string; time: string }[] }[];
};

interface FormValues {
  studentId: string;
  batchSlot: string;
  monthPaid: string;
  paymentDate: string;
  remark?: string;
}

const FeeAddPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const recordId = params.get("id");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      studentId: "",
      batchSlot: "",
      monthPaid: "",
      paymentDate: "",
      remark: "",
    },
  });

  const studentId = useWatch({ control, name: "studentId" });

  const [students, setStudents] = useState<Student[]>([]);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);
  const [slotOptions, setSlotOptions] = useState<{ value: string; label: string }[]>([]);

  // Load students list
  useEffect(() => {
    apiClient
      .get<Student[]>("/api/students")
      .then(r => setStudents(r.data))
      .catch(console.error);
  }, []);

  // On edit, load fee record and reset form
  useEffect(() => {
    if (!recordId) return;
    apiClient
      .get<any[]>(`/api/fees?id=${recordId}`)
      .then(r => {
        const rec = Array.isArray(r.data) ? r.data[0] : r.data;
        // reconstruct batchSlot and monthPaid
        const slotVal = `${rec.batch.id}|${rec.slot.day}|${rec.slot.time}`;
        const monthPaid = `${rec.monthPaid.year}-${String(new Date(Date.parse(rec.monthPaid.month + ' 1')).getMonth() + 1).padStart(2,'0')}`;
        reset({
          studentId: rec.student.id,
          batchSlot: slotVal,
          monthPaid,
          paymentDate: rec.paymentDate,
          remark: rec.remark || "",
        });
      })
      .catch(console.error);
  }, [recordId, reset]);

  // Update studentDetail & slots when student changes
  useEffect(() => {
    if (!studentId) {
      setStudentDetail(null);
      setSlotOptions([]);
      return;
    }
    apiClient
      .get<Student[]>(`/api/students?id=${studentId}`)
      .then(r => {
        const stu = Array.isArray(r.data) ? r.data[0] : r.data;
        setStudentDetail(stu);
        const opts: { value: string; label: string }[] = [];
        stu.batches.forEach(b => {
          b.schedules.forEach(s => {
            opts.push({
              value: `${b.id}|${s.day}|${s.time}`,
              label: `${b.name} - ${s.day} @ ${s.time}`,
            });
          });
        });
        setSlotOptions(opts);
      })
      .catch(console.error);
  }, [studentId]);

  const onSubmit = async (data: FormValues) => {
    // parse monthPaid
    const [year, monthNum] = data.monthPaid.split("-");
    const monthNames = [
      'January','February','March','April','May','June','July','August','September','October','November','December'
    ];
    const month = monthNames[Number(monthNum) - 1];
    const monthPaidObj = { month, year };

    const [batchId, day, time] = data.batchSlot.split("|");
    const payload = {
      student: { id: data.studentId, name: studentDetail?.name },
      batch:   { id: batchId, name: studentDetail?.batches.find(b=>b.id===batchId)?.name },
      slot:    { day, time },
      monthPaid: monthPaidObj,
      paymentDate: data.paymentDate,
      remark: data.remark,
    };

    try {
      if (recordId) {
        await apiClient.put(`/api/fees?id=${recordId}`, payload);
      } else {
        await apiClient.post('/api/fees', payload);
      }
      router.push('/coachingSystem/fee');
    } catch {
      alert('Failed to save fee');
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow">
      <button onClick={() => router.back()} className="underline mb-4">← Back</button>
      <h1 className="text-2xl mb-4">{recordId ? 'Edit' : 'Add'} Fee</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-5 rounded-lg">
        {/* Student */}
        <div>
          <label className="block text-sm font-medium mb-1">Student</label>
          <select {...register('studentId',{ required:'Required' })} className="w-full border p-2 rounded">
            <option value="">Select Student</option>
            {students.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {errors.studentId && <p className="text-red-600 text-sm">{errors.studentId.message}</p>}
        </div>
        {/* Slot */}
        {slotOptions.length>0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Batch & Slot</label>
            <select {...register('batchSlot',{ required:'Required' })} className="w-full border p-2 rounded">
              <option value="">Select</option>
              {slotOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {errors.batchSlot && <p className="text-red-600 text-sm">{errors.batchSlot.message}</p>}
          </div>
        )}
        {/* Month & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Month Paid</label>
            <input type="month" {...register('monthPaid',{ required:'Required'})} className="w-full border p-2 rounded" />
            {errors.monthPaid && <p className="text-red-600 text-sm">{errors.monthPaid.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Date</label>
            <input type="date" {...register('paymentDate',{ required:'Required'})} className="w-full border p-2 rounded" />
            {errors.paymentDate && <p className="text-red-600 text-sm">{errors.paymentDate.message}</p>}
          </div>
        </div>
        {/* Remark */}
        <div>
          <label className="block text-sm font-medium mb-1">Remark</label>
          <textarea {...register('remark')} className="w-full border p-2 rounded" rows={3}/>
        </div>
        <button type="submit" className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
const FeePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeeAddPage />
    </Suspense>
  );
};

export default FeePage;