import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const remindersCollection = db.collection("reminders");

    // Get current time in IST (formatted as YYYY-MM-DDTHH:mm)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const currentTime = new Date(now.getTime() + istOffset).toISOString().slice(0, 16);
    console.log(currentTime);

    // Return all reminders for the employee where time is less than or equal to current IST time and not notified.
    const reminders = await remindersCollection.find({
      employeeId,
      time: { $lte: currentTime },
      notified: false,
    }).toArray();

    return NextResponse.json({ success: true, reminders });
  } catch (error: any) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
