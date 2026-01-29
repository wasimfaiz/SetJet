import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");

    // Fetch the employee document to check permissions
    const employee = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const results: Record<string, any> = {};

    // Compute the current IST time (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const currentTime = new Date(now.getTime() + istOffset).toISOString().slice(0, 16);
    console.log("Current IST Time:", currentTime);

    // Fetch reminders for the employee
    const reminders = await db.collection("reminders").find({
      employeeId,
      time: { $lte: currentTime },
      notified: false,
    }).toArray();


    return NextResponse.json({ success: true, reminders });
  } catch (error: any) {
    console.error("Error in merged poll route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
