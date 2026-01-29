"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import apiClient from "@/app/utils/apiClient";

type Employee = {
  _id: string;
  basicField: {
    name: string;
    empId: string;
  };
};

interface LeaveRecord {
  id?: string;
  employee: { id: string; name: string };
  month: { year: string; month: string };
  leaves: { date: string; type: string; leave_days?: number }[];
  remark?: string;
}

interface FormValues {
  employeeId: string;
  month: string; // yyyy-MM
  leaves: { date: string; type: string; leave_days?: number }[];
  remark?: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const LeaveAddPage = () => {
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
      employeeId: "",
      month: "",
      leaves: [{ date: "", type: "Full Day", leave_days: 1 }],
      remark: "",
    },
  });

  const employeeId = useWatch({ control, name: "employeeId" });
  const month = useWatch({ control, name: "month" });
  const leaves = useWatch({ control, name: "leaves" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "leaves",
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // load employees
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Employee[]>("/api/employees")
      .then((r) => {
        if (cancelled) return;
        setEmployees(r.data || []);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  // on edit, load existing leave record
  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<LeaveRecord[]>(`/api/leaves?id=${recordId}`)
      .then((r) => {
        if (cancelled) return;
        const rec = Array.isArray(r.data) ? r.data[0] : r.data;
        if (!rec) return;

        // convert month stored as { year: '2025', month: 'October' } to yyyy-MM
        const monthName = rec.month?.month;
        let monthVal = "";
        if (rec.month?.year && monthName) {
          const idx = monthNames.indexOf(monthName);
          if (idx >= 0) {
            const mm = String(idx + 1).padStart(2, "0");
            monthVal = `${rec.month.year}-${mm}`;
          } else {
            // fallback: attempt parse if monthName is numeric string
            monthVal = `${rec.month.year}-${String(
              new Date(`${monthName} 1`).getMonth() + 1
            ).padStart(2, "0")}`;
          }
        }

        // normalize leaves shape to include leave_days
        const normLeaves = (rec.leaves || []).map((l: any) => {
          const type = l.type || "Full Day";
          const leave_days =
            typeof l.leave_days === "number"
              ? l.leave_days
              : type === "Half Day" ||
                (type && type.toLowerCase().includes("half"))
              ? 0.5
              : 1;
          return { date: l.date, type, leave_days };
        });

        reset({
          employeeId: rec.employee?.id || "",
          month: monthVal,
          leaves: normLeaves.length
            ? normLeaves
            : [{ date: "", type: "Full Day", leave_days: 1 }],
          remark: rec.remark || "",
        });
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordId, reset]);

  // set employee name
  useEffect(() => {
    const emp = employees.find(
      (e) => e._id === employeeId || e.basicField.empId === employeeId
    );
    setEmployeeName(emp ? emp.basicField.name : "");
  }, [employeeId, employees]);

  // compute leave stats
  const { allowedLeaves, takenLeaves, remainingLeaves, displayMonth } =
    useMemo(() => {
      const allowed = 1.5; // per month
      let taken = 0;
      if (leaves && Array.isArray(leaves)) {
        leaves.forEach((l: any) => {
          if (typeof l.leave_days === "number") taken += Number(l.leave_days);
          else if (l.type === "Full Day") taken += 1;
          else if (l.type === "Half Day") taken += 0.5;
        });
      }
      const remaining = Math.max(0, allowed - taken);

      let display = "";
      if (month) {
        const [y, m] = month.split("-");
        const names = monthNames;
        if (m) {
          display = `${names[Number(m) - 1]} ${y}`;
        }
      }
      return {
        allowedLeaves: allowed,
        takenLeaves: taken,
        remainingLeaves: remaining,
        displayMonth: display,
      };
    }, [leaves, month]);

  const onSubmit = async (data: FormValues) => {
    // basic validation
    if (!data.employeeId) {
      alert("Please select an employee");
      return;
    }
    if (!data.month) {
      alert("Please pick a month");
      return;
    }

    const [year, monthNum] = data.month.split("-");
    const monthName = monthNames[Number(monthNum) - 1];

    // normalize leaves array to include numeric leave_days
    const normalizedLeaves = (data.leaves || []).map((l) => ({
      date: l.date,
      type: l.type,
      leave_days:
        typeof l.leave_days === "number"
          ? l.leave_days
          : l.type === "Half Day"
          ? 0.5
          : 1,
    }));

    const payload: LeaveRecord = {
      employee: { id: data.employeeId, name: employeeName },
      month: { year, month: monthName },
      leaves: normalizedLeaves,
      remark: data.remark,
    };

    try {
      if (recordId) {
        await apiClient.put(`/api/leaves?id=${recordId}`, payload);
      } else {
        await apiClient.post("/api/leaves", payload);
      }
      router.back();
    } catch (e) {
      console.error(e);
      alert("Failed to save leave record");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow">
      <button onClick={() => router.back()} className="underline mb-4">
        ← Back
      </button>
      <h1 className="text-2xl mb-4">
        {recordId ? "Edit" : "Add"} Leave Record
      </h1>

      {/* Leave Summary */}
      <div className="bg-white p-5 rounded-lg">
        {month && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p className="font-medium font-bold">
              Leave Summary for {displayMonth || "—"}
            </p>
            <p>Allowed: {allowedLeaves} days</p>
            <p>Taken: {takenLeaves}</p>
            <p>Remaining: {remainingLeaves}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select
              {...register("employeeId", { required: "Required" })}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.basicField.name}
                </option>
              ))}
            </select>
            {errors.employeeId && (
              <p className="text-red-600 text-sm">
                {errors.employeeId.message}
              </p>
            )}
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input
              type="month"
              {...register("month", { required: "Required" })}
              className="w-full border p-2 rounded"
            />
            {errors.month && (
              <p className="text-red-600 text-sm">{errors.month.message}</p>
            )}
          </div>

          {/* Dynamic Leaves Array */}
          <div>
            <label className="block text-sm font-medium mb-1">Leaves</label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 mb-2">
                <input
                  type="date"
                  {...register(`leaves.${index}.date` as const, {
                    required: true,
                  })}
                  className="border p-2 rounded flex-1"
                />
                <select
                  {...register(`leaves.${index}.type` as const, {
                    required: true,
                  })}
                  className="border p-2 rounded"
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </select>

                {/* optional: show computed leave_days for transparency */}
                <div className="text-sm w-20 text-center">
                  {fields[index] &&
                    (fields[index].leave_days ??
                      (fields[index].type === "Half Day" ? 0.5 : 1))}
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({ date: "", type: "Full Day", leave_days: 1 })
              }
              className="text-blue-600"
            >
              + Add Date
            </button>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium mb-1">Remark</label>
            <textarea
              {...register("remark")}
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

const LeavePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LeaveAddPage />
  </Suspense>
);

export default LeavePage;
