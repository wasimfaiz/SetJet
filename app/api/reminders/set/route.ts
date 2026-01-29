// app/api/reminders/set/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { employeeId, message, time, targetId, type } = await req.json();

    // Validate required fields
    if (!employeeId || !message || !time || !targetId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");

    // Build reminder document
    const reminder = {
      employeeId,
      message,
      time,
      createdAt: new Date(),
      notified: false,
      targetId: new ObjectId(targetId),
      type,
    };

    // Insert into reminders collection
    const { insertedId } = await db.collection("reminders").insertOne(reminder);
    if (!insertedId) {
      return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
    }

    // Fetch the inserted reminder without targetId
    const createdReminder = await db.collection("reminders").findOne(
      { _id: insertedId },
      { projection: { targetId: 0 } }
    );
    if (!createdReminder) {
      return NextResponse.json({ error: "Failed to retrieve created reminder" }, { status: 500 });
    }

    // Determine which collection to update based on type
    let updateResult;
    if (type === "lead") {
      updateResult = await db.collection("student-leads").updateOne(
        { _id: new ObjectId(targetId) },
        //@ts-ignore
        { $push: { reminders: createdReminder } }
      );
    } else if (type === "business") {
      updateResult = await db.collection("businesses").updateOne(
        { _id: new ObjectId(targetId) },
        //@ts-ignore
        { $push: { reminders: createdReminder } }
      );
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'lead' or 'business'." }, { status: 400 });
    }

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: `Target ${type} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, reminder: createdReminder });

  } catch (error: any) {
    console.error("Error adding reminder:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
