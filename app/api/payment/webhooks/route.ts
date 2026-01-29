import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db("mydatabase");
};

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Basic source validation
    const source = req.headers.get("x-source");
    const secret = req.headers.get("x-webhook-secret");

    if (
      source !== "yastudy-website" ||
      secret !== process.env.CRM_WEBHOOK_SECRET
    ) {
      console.warn("[CRM] Unauthorized webhook");
      return NextResponse.json({ success: true });
    }

    const body = await req.json();

    const {
      merchantOrderId,
      paymentStatus,
      name,
      email,
      phone,
      course,
      slotId
    } = body;

    if (paymentStatus !== "SUCCESS") {
      return NextResponse.json({ success: true });
    }

    // Only allowed courses
    const allowedCourses = ["german", "ielts", "german demo"];
    if (!allowedCourses.includes(course)) {
      return NextResponse.json({ success: true });
    }

    const db = await getDb();

    // 2️⃣ Resolve / Create Student (email = unique)
    let student = await db.collection("students").findOne({ email });

    if (!student) {
      const insertRes = await db.collection("students").insertOne({
        name,
        email,
        phone,
        course,
        source: "yastudy.com",
        createdAt: new Date()
      });

      student = { _id: insertRes.insertedId };
      console.log("[CRM] Student created:", email);
    }

    // 3️⃣ Prevent duplicate booking
    const existingBooking = await db.collection("bookings").findOne({
      merchantOrderId
    });

    if (existingBooking) {
      console.log("[CRM] Booking already exists:", merchantOrderId);
      return NextResponse.json({ success: true });
    }

    // 4️⃣ Create booking
    await db.collection("bookings").insertOne({
      studentId: student._id,
      merchantOrderId,
      course,
      slotId,
      source: "phonepe",
      createdAt: new Date()
    });

    console.log("✅ [CRM] Booking created for:", email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CRM-phonepe-webhook] Error:", err);
    return NextResponse.json({ success: true });
  }
}
