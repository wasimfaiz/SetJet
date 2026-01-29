// app/api/reminders/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const searchTerm = url.searchParams.get("searchTerm")?.trim();
    const dateFilter = url.searchParams.get("date");
    const employeeId = url.searchParams.get("employeeId");
    const notifiedParam = url.searchParams.get("notified");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const client = await clientPromise;
    const db = client.db("mydatabase");

    if (id) {
      // Fetch by reminder ID
      const reminder = await db.collection("reminders").findOne({ _id: new ObjectId(id) });
      if (!reminder) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, reminder });
    }

    // Pagination defaults
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const skip = (page - 1) * limit;

    // Build filters
    const filters: any = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      filters.$or = [
        { message: regex },
        { type: regex }
      ];
    }
    if (dateFilter) {
      filters.time = { $regex: `^${dateFilter}T`, $options: "i" };
    }
    if (employeeId) {
      filters.employeeId = employeeId;
    }
    if (notifiedParam !== null) {
      filters.notified = notifiedParam === "true";
    }

    // Fetch total count and data
    const [totalReminders, reminders] = await Promise.all([
      db.collection("reminders").countDocuments(filters),
      db.collection("reminders")
        .find(filters)
        .sort({ time: 1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    ]);

    const totalPages = Math.ceil(totalReminders / limit);

    return NextResponse.json({
      success: true,
      reminders,
      pagination: { page, limit, totalReminders, totalPages }
    });
  } catch (error: any) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
