import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

const COLLECTION_NAME = "leaves";

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

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection(COLLECTION_NAME);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const employeeId = url.searchParams.get("employeeId");
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");

    //
    // 1) If employeeId is present → return both records and a month‐wise summary
    //
    // ------------------- Replace the "if (employeeId) { ... }" branch with this -------------------
    if (employeeId) {
      // (a) Determine year & month for summary (default to current)
      const now = new Date();
      const year = yearParam || String(now.getFullYear());
      let monthName: string;
      if (monthParam) {
        // monthParam may be numeric ("10") or a month name ("October")
        if (/^\d+$/.test(monthParam)) {
          const idx = Number(monthParam) - 1;
          monthName = monthNames[idx] || "";
        } else {
          monthName = monthParam;
        }
      } else {
        monthName = monthNames[now.getMonth()];
      }

      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex < 0) {
        return NextResponse.json(
          { error: "Invalid month parameter" },
          { status: 400 }
        );
      }

      // (b) Fetch all matching docs for the year (we will aggregate per-month in-memory)
      // Optionally: filter only approved leaves by adding {"approval_status": "APPROVED"} if you store that
      const records = await collection
        .find({ "employee.id": employeeId, "month.year": year })
        .toArray();

      // (c) Group leave entries by month index (from record.month.month)
      const leavesByMonth: Record<number, any[]> = {};
      records.forEach((doc) => {
        const mName = doc.month?.month;
        const mIdx = monthNames.indexOf(mName);
        if (mIdx < 0) return;
        if (!Array.isArray(doc.leaves)) return;
        if (!leavesByMonth[mIdx]) leavesByMonth[mIdx] = [];
        // push leaves with defensive shape normalization
        doc.leaves.forEach((l: any) => {
          // normalize: ensure date, type, leave_days
          const type = (l.type || "").toString();
          const leaveDays =
            typeof l.leave_days === "number"
              ? l.leave_days
              : typeof l.leaveDays === "number"
              ? l.leaveDays
              : l.type === "Half Day" || type.toLowerCase().includes("half")
              ? 0.5
              : 1;
          leavesByMonth[mIdx].push({
            ...l,
            type,
            leave_days: leaveDays,
          });
        });
      });

      // (d) Helper to sum leave days using leave_days when present
      const sumLeaveDays = (entries: any[]) => {
        return entries.reduce((acc: number, entry: any) => {
          const ld =
            typeof entry.leave_days === "number"
              ? entry.leave_days
              : entry.leaveDays || 0;
          return acc + (Number(ld) || 0);
        }, 0);
      };

      // (e) Compute carryover from previous months (policy: 1.5 entitlement per month)
      let entitlementUntilPrev = 0;
      let takenUntilPrev = 0;
      for (let idx = 0; idx < monthIndex; idx++) {
        entitlementUntilPrev += 1.5;
        const prevEntries = leavesByMonth[idx] || [];
        takenUntilPrev += sumLeaveDays(prevEntries);
      }
      const carryover = Math.max(entitlementUntilPrev - takenUntilPrev, 0);

      // (f) Compute this month’s values
      const thisMonthEntries = leavesByMonth[monthIndex] || [];
      const leavesTakenThisMonth = sumLeaveDays(thisMonthEntries);
      // absents = SUM(leave_days) for entries whose type is 'Absent' (case-insensitive)
      const absentsThisMonth = thisMonthEntries.reduce(
        (acc: number, e: any) => {
          const t = (e.type || "").toString().toLowerCase();
          const ld = Number(e.leave_days || 0);
          return acc + (t === "absent" ? (isFinite(ld) ? ld : 1) : 0);
        },
        0
      );

      // Return both records and summary object (always stable shape)
      return NextResponse.json(
        {
          records,
          summary: {
            employeeId,
            year,
            month: monthName,
            entitlementThisMonth: 1.5,
            leavesTakenThisMonth,
            absentsThisMonth,
            carryoverFromPreviousMonths: carryover,
          },
        },
        { status: 200 }
      );
    }

    //
    // 2) If id is present (and no employeeId) → return single document
    //
    if (id) {
      if (!ObjectId.isValid(id)) {
        throw new Error("Invalid ID format");
      }
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      return NextResponse.json(doc, { status: 200 });
    }

    //
    // 3) Otherwise → apply month/year filtering and return all matching docs
    //
    const query: any = {};
    if (monthParam && yearParam) {
      query["month.year"] = yearParam;
      query["month.month"] = monthParam;
    } else if (yearParam) {
      query["month.year"] = yearParam;
    }

    const docs = await collection.find(query).toArray();
    return NextResponse.json(docs, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.insertOne(payload);
    const inserted = await collection.findOne({ _id: result.insertedId });
    return NextResponse.json(inserted, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const payload = await request.json();
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection(COLLECTION_NAME);

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: payload });
    const updated = await collection.findOne({ _id: new ObjectId(id) });
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection(COLLECTION_NAME);

    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
