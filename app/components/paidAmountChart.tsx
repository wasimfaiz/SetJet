// components/PaidAmountChart.tsx
"use client";

import React, { useMemo, useState } from "react";
import { parseISO, getYear, getMonth, getDate, getDaysInMonth } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type InvoiceItem = {
  itemDate?: string | null;
  paidamount?: string | number | null;
};

type Invoice = {
  items?: InvoiceItem[] | null;
};

interface PaidAmountChartProps {
  invoices: Invoice[];
}

const MONTHS = [
  { label: "All", value: -1 },
  { label: "Jan", value: 0 },
  { label: "Feb", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Apr", value: 3 },
  { label: "May", value: 4 },
  { label: "Jun", value: 5 },
  { label: "Jul", value: 6 },
  { label: "Aug", value: 7 },
  { label: "Sep", value: 8 },
  { label: "Oct", value: 9 },
  { label: "Nov", value: 10 },
  { label: "Dec", value: 11 },
];

export default function PaidAmountChart({ invoices }: PaidAmountChartProps) {
  // State
  const [yearFilter, setYearFilter] = useState<number>(-1);
  const [monthFilter, setMonthFilter] = useState<number>(-1);

  // Flatten + parse all items (defensive)
  const items = useMemo(() => {
    return invoices
      .flatMap((inv) =>
        (inv.items || []).map((it) => {
          if (!it || !it.itemDate) return null;
          // parseISO throws if invalid; guard with try/catch
          try {
            const date = parseISO(it.itemDate);
            if (Number.isNaN(date.getTime())) return null;
            const paidRaw =
              typeof it.paidamount === "number"
                ? it.paidamount
                : Number(it.paidamount);
            const paid = isFinite(paidRaw) ? paidRaw : 0;
            return { date, paid };
          } catch {
            return null;
          }
        })
      )
      .filter((x): x is { date: Date; paid: number } => x !== null);
  }, [invoices]);

  // Unique years in data (sorted desc). If none, include current year as option.
  const years = useMemo(() => {
    const set = new Set(items.map(({ date }) => getYear(date)));
    const arr = Array.from(set).sort((a, b) => b - a);
    if (arr.length === 0) {
      const current = new Date().getFullYear();
      return [current];
    }
    return arr;
  }, [items]);

  // Total revenue (all filtered)
  const totalRevenue = useMemo(
    () => items.reduce((sum, { paid }) => sum + paid, 0),
    [items]
  );

  // Revenue for selected year (or all)
  const yearlyRevenue = useMemo(() => {
    if (yearFilter < 0) return totalRevenue;
    return items
      .filter(({ date }) => getYear(date) === yearFilter)
      .reduce((sum, { paid }) => sum + paid, 0);
  }, [items, totalRevenue, yearFilter]);

  // Aggregate by month (respecting yearFilter)
  const monthlyData = useMemo(() => {
    const sums = Array(12).fill(0);
    items.forEach(({ date, paid }) => {
      if (yearFilter < 0 || getYear(date) === yearFilter) {
        const m = getMonth(date);
        if (m >= 0 && m < 12) sums[m] += paid;
      }
    });
    return sums.map((total, idx) => ({
      label: MONTHS[idx + 1].label, // MONTHS[0] is "All"
      value: total,
    }));
  }, [items, yearFilter]);

  // Aggregate by day within selected month & year
  const dailyData = useMemo(() => {
    if (monthFilter < 0) return [];
    const year = yearFilter >= 0 ? yearFilter : new Date().getFullYear();
    const daysInMonth = getDaysInMonth(new Date(year, monthFilter));
    const sums = Array(daysInMonth).fill(0);
    items.forEach(({ date, paid }) => {
      if (
        getMonth(date) === monthFilter &&
        (yearFilter < 0 || getYear(date) === yearFilter)
      ) {
        const d = getDate(date);
        if (d >= 1 && d <= daysInMonth) sums[d - 1] += paid;
      }
    });
    return sums.map((total, idx) => ({
      label: String(idx + 1),
      value: total,
    }));
  }, [items, monthFilter, yearFilter]);

  // Revenue for selected month & year
  const monthlyRevenue = useMemo(
    () =>
      monthFilter < 0 ? 0 : dailyData.reduce((sum, d) => sum + d.value, 0),
    [dailyData, monthFilter]
  );

  // Data to plot
  const dataToPlot = monthFilter < 0 ? monthlyData : dailyData;

  return (
    <div className="p-6 bg-white rounded shadow space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="year" className="font-medium">
            Year:
          </label>
          <select
            id="year"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(Number(e.target.value));
              setMonthFilter(-1);
            }}
            className="border rounded px-3 py-1"
          >
            <option value={-1}>All</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="month" className="font-medium">
            Month:
          </label>
          <select
            id="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revenue Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="mt-1 text-2xl font-semibold">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            {yearFilter < 0 ? "All-Year Revenue" : `${yearFilter} Revenue`}
          </p>
          <p className="mt-1 text-2xl font-semibold">
            ₹{yearlyRevenue.toLocaleString()}
          </p>
        </div>
        {monthFilter >= 0 && (
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              {`${MONTHS[monthFilter + 1].label} ${
                yearFilter < 0 ? "" : yearFilter
              }`}{" "}
              Revenue
            </p>
            <p className="mt-1 text-2xl font-semibold">
              ₹{monthlyRevenue.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dataToPlot}
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
        >
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1f77b4"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
