"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/app/utils/apiClient";

interface LeaveEntry {
  date: string;
  type: string;
}
interface LeaveRecord {
  _id: string;
  employee: { id: string; name: string };
  month: { year: string; month: string };
  leaves: LeaveEntry[];
  remark?: string;
}

interface MonthlySummary {
  employeeId: string;
  year: string;
  month: string;
  entitlementThisMonth: number;
  leavesTakenThisMonth: number;
  absentsThisMonth: number;
  carryoverFromPreviousMonths: number;
}

export default function LeaveViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = params.id;

  const currentYear = new Date().getFullYear().toString();
  const selectedYearParam = searchParams.get("year") || currentYear;

  const [allYears, setAllYears] = useState<string[]>([]);
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch available years and employee name
  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await apiClient.get<{ records: LeaveRecord[]; summary: MonthlySummary }>(
          `/api/leaves?employeeId=${employeeId}`
        );
        const dataRecords = res.data.records;
        const years = Array.from(new Set(dataRecords.map((r) => r.month.year)));

        // Ensure selectedYearParam is included in allYears
        if (!years.includes(selectedYearParam)) {
          years.push(selectedYearParam);
        }

        years.sort((a, b) => Number(b) - Number(a));
        setAllYears(years);

        if (dataRecords.length > 0) {
          setEmployeeName(dataRecords[0].employee.name);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchYears();
  }, [employeeId, selectedYearParam]); // Add selectedYearParam as dependency

  // Fetch records + summary for selected year
  useEffect(() => {
    setLoading(true);
    async function fetchRecords() {
      try {
        const year = selectedYearParam;
        const res = await apiClient.get<{ records: LeaveRecord[]; summary: MonthlySummary }>(
          `/api/leaves?employeeId=${employeeId}&year=${year}`
        );
        setRecords(res.data.records);
        setSummary(res.data.summary);
      } catch (e) {
        console.error(e);
        setRecords([]); // set it to empty, no records
        setSummary(null); // set it to null to show no monthly summary
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [employeeId, selectedYearParam]);

  const onYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    router.push(`/leave/${employeeId}?year=${year}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow">
      <button onClick={() => router.back()} className="underline mb-4">
        ← Back
      </button>
      <h1 className="text-2xl font-semibold mb-4">Leave History for {employeeName}</h1>
      <div className="bg-white p-5 rounded-lg">
        {/* Year Selector */}
        <div className="mb-6">
          <label className="mr-2 font-medium">Select Year:</label>
          <select
            value={selectedYearParam}
            onChange={onYearChange}
            className="border p-2 rounded"
          >
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Summary */}
        {summary && (
          <section className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="text-lg font-medium mb-2">
              Summary for {summary.month} {summary.year}
            </h2>
            <p>Entitlement This Month: {summary.entitlementThisMonth} days</p>
            <p>Leaves Taken This Month: {summary.leavesTakenThisMonth} days</p>
            <p>Absents This Month: {summary.absentsThisMonth}</p>
            <p>Carryover From Previous Months: {summary.carryoverFromPreviousMonths} days</p>
          </section>
        )}

        {/* Monthly Breakdown */}
        {records.length === 0 ? (
          <p>No leave records for {selectedYearParam}.</p>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <div key={rec._id} className="p-4 border rounded">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {rec.month.month} {rec.month.year}
                  </h3>
                  <button
                    onClick={() => router.push(`/hrSystem/leave/add?id=${rec._id}`)}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </button>
                </div>
                <ul className="list-disc list-inside mt-2">
                  {rec.leaves.map((l, idx) => (
                    <li key={idx}>
                      {new Date(l.date).toLocaleDateString()}: {l.type}
                    </li>
                  ))}
                </ul>
                {rec.remark && (
                  <p className="mt-2">
                    <span className="font-semibold">Remark:</span> {rec.remark}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}