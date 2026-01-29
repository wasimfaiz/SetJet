// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db("mydatabase");
};

const safeObjectId = (idString: string | null | undefined): ObjectId | null => {
  if (!idString || typeof idString !== "string") return null;
  return ObjectId.isValid(idString) ? new ObjectId(idString) : null;
};

// GET – Fetch bookings
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);

    const course = searchParams.get("course");
    const batch = searchParams.get("batch");
    const slotId = searchParams.get("slotId");
    const studentIdParam = searchParams.get("studentId");
    const applicationId = searchParams.get("applicationId");

    const filter: any = {};

    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    const validSlotId = safeObjectId(slotId);
    if (validSlotId) filter.slotId = validSlotId;

    const validAppId = safeObjectId(applicationId);
    if (validAppId) filter.applicationId = validAppId;

    // STUDENT FILTER – support both common field names
    const studentIdInput = studentIdParam;
    const oid = safeObjectId(studentIdInput);

    if (oid) {
      filter.$or = [
        { studentId: oid },
        { student: oid },
        { student: studentIdInput },
        { studentId: studentIdInput }
      ];
    }

    if (Object.keys(filter).length === 0) {
      filter.status = { $ne: "cancelled" };
    }

    console.log("🔍 Bookings GET filter:", JSON.stringify(filter, null, 2));
    console.log("   studentId param received:", studentIdInput);

    const bookings = await db
      .collection("bookings")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // For extra visibility during debugging
    console.log(`   → Found ${bookings.length} booking(s)`);

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      filterUsed: filter,
      totalCount: bookings.length,
      queriedStudentId: studentIdInput || null,
    });

  } catch (err) {
    console.error("❌ GET /bookings error:", err);
    return NextResponse.json(
      {
        success: false,
        bookings: [],
        error: "Server error",
      },
      { status: 500 }
    );
  }
}

// 🔥 POST – COMPLETE MANUAL + PAYMENT BOOKING SUPPORT
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    console.log("📥 POST /bookings:", {
      course: body.course,
      slotId: body.slotId,
      hasStudentId: !!body.studentId,
      name: body.name
    });

    const { course, slotId, email, phoneNumber, name, paymentDetails, studentId, applicationId, batch } = body;

    if (!course || !slotId) {
      return NextResponse.json({ error: "Course and slotId required" }, { status: 400 });
    }

    // 🔥 CASE 1: MANUAL BOOKING WITHOUT studentId (Postman Test - NEW STUDENT)
    if (slotId.startsWith("MANUAL_") && (!studentId || !ObjectId.isValid(studentId))) {
      console.log("✅ MANUAL NEW STUDENT - Creating student + booking");
      
      // Create student first
      const studentResult = await db.collection("students").insertOne({
        name: name || "Postman Student",
        email: email || "",
        phoneNumber: phoneNumber || "",
        course,
        source: "postman_test",
        regDate: new Date(),
        createdAt: new Date()
      });

      // Create booking
      const bookingResult = await db.collection("bookings").insertOne({
        course,
        batch: batch || "Postman Test",
        slotId,
        studentId: studentResult.insertedId,  // ✅ Use NEW student ID
        paymentDetails: paymentDetails || null,
        status: "confirmed",
        createdAt: new Date(),
        slotInfo: { 
          date: "manual", 
          timeSlot: "postman-test", 
          type: "manual" 
        },
        isManual: true,
        source: "postman_test"
      });

      console.log("✅ NEW STUDENT + BOOKING CREATED:", {
        studentId: studentResult.insertedId.toString(),
        bookingId: bookingResult.insertedId.toString()
      });

      return NextResponse.json({
        success: true,
        studentId: studentResult.insertedId.toString(),
        bookingId: bookingResult.insertedId.toString(),
        message: "New student + booking created successfully"
      });
    }

    // 🔥 CASE 2: MANUAL BOOKING WITH EXISTING studentId (Batch Assign)
    if (slotId.startsWith("MANUAL_") && studentId && ObjectId.isValid(studentId)) {
      console.log("✅ MANUAL EXISTING STUDENT:", studentId);
      
      const bookingResult = await db.collection("bookings").insertOne({
        course,
        batch: batch || "Manual Assignment",
        slotId,
        studentId: new ObjectId(studentId),
        paymentDetails: paymentDetails || null,
        status: "confirmed",
        createdAt: new Date(),
        slotInfo: { 
          date: "manual", 
          timeSlot: "batch-assignment", 
          type: "manual" 
        },
        isManual: true,
        source: "batch_assignment"
      });

      console.log("✅ BOOKING ADDED TO STUDENT:", studentId);
      
      return NextResponse.json({
        success: true,
        studentId,
        bookingId: bookingResult.insertedId.toString(),
        message: "Booking added to existing student"
      });
    }

    // 🟢 CASE 3: REAL SLOT PAYMENT (your original code)
    console.log("🔍 Real slot validation...");
    const slot = await db.collection("slots").findOne({
      _id: new ObjectId(slotId),
      isActive: true,
    });

    if (!slot) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 404 });
    }

    // ... rest of your existing payment logic (unchanged) ...
    const existingBooking = await db.collection("bookings").findOne({
      slotId: new ObjectId(slotId),
      status: { $ne: "cancelled" },
    });
    
    if (existingBooking) {
      return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
    }

    // 3. Get application data (if provided)
    let application = null;
    if (applicationId) {
      application = await db.collection("applications").findOne({
        _id: new ObjectId(applicationId),
      });
    }

    // 4. Create student data
    const studentData = {
      name: name || application?.name || application?.studentName || "Student",
      email: email || application?.email || "",
      phoneNumber: phoneNumber || application?.phoneNumber || application?.mobile || "",
      course,
      paymentStatus: "paid",
      createdAt: new Date(),
      source: "phonepe_payment",
      ...(application && { applicationId: new ObjectId(application._id) }),
    };

 // 5. Find or create student
    let finalStudentId: string;
    const existingStudent = await db.collection("students").findOne({
      $or: [
        { email: studentData.email, phoneNumber: studentData.phoneNumber },
        { applicationId: application?._id },
      ],
    });

    if (existingStudent) {
      finalStudentId = existingStudent._id.toString();
    } else {
      const result = await db.collection("students").insertOne({
        ...studentData,
        batches: [{
          id: batch || slot.batch || slot._id.toString(),
          name: batch || slot.batch || "Auto-batch",
          schedules: [{ day: slot.date, time: slot.timeSlot }],
        }],
      });
      finalStudentId = result.insertedId.toString();
    }

    // 6. Create booking
    const bookingResult = await db.collection("bookings").insertOne({
      course,
      batch: batch || slot.batch || null,
      slotId: new ObjectId(slotId),
      studentId: new ObjectId(finalStudentId),
      ...(application && { applicationId: new ObjectId(application._id) }),
      paymentDetails: paymentDetails || null,
      status: "confirmed",
      createdAt: new Date(),
      slotInfo: { date: slot.date, timeSlot: slot.timeSlot },
    });

    return NextResponse.json({
      success: true,
      bookingId: bookingResult.insertedId.toString(),
      studentId: finalStudentId,
      message: "Payment booking created successfully",
    });

  } catch (err) {
    console.error("❌ POST /bookings ERROR:", err);
    return NextResponse.json({ 
      success: false,
      error: `Server error: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 });
  }
}

