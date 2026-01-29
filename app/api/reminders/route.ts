import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 });
    }

    const body = await req.json();
    const { message, time, notified, type, targetId } = body;

    if (!type || !targetId) {
      return NextResponse.json({ error: "Missing type or targetId" }, { status: 400 });
    }

    // Prepare the update object
    const updateFields: Record<string, any> = {};
    if (message !== undefined) updateFields.message = message;
    if (time !== undefined) updateFields.time = time;
    if (notified !== undefined) updateFields.notified = notified;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const dbClient = await clientPromise;
    const db = dbClient.db("mydatabase");

    const remindersCollection = db.collection("reminders");
    const leadsCollection = db.collection("student-leads");
    const businessesCollection = db.collection("businesses");

    // Step 1: Update reminder document in reminders collection
    const existingReminder = await remindersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const updateResult = await remindersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "No changes made to reminder" }, { status: 404 });
    }

    // Step 2: Reflect changes in student-leads or businesses collection
    const updatedReminder = { ...existingReminder, ...updateFields };

    let parentUpdateResult;

    if (type === "lead") {
      parentUpdateResult = await leadsCollection.updateOne(
        { _id: new ObjectId(targetId), "reminders._id": new ObjectId(id) },
        { $set: { "reminders.$": updatedReminder } }
      );
    } else if (type === "business") {
      parentUpdateResult = await businessesCollection.updateOne(
        { _id: new ObjectId(targetId), "reminders._id": new ObjectId(id) },
        { $set: { "reminders.$": updatedReminder } }
      );
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (parentUpdateResult.modifiedCount === 0) {
      return NextResponse.json({ warning: "Reminder updated, but not reflected in parent collection" }, { status: 200 });
    }

    return NextResponse.json({ message: "Reminder updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error in PUT /api/reminders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 });
    }

    const dbClient = await clientPromise;
    const db = dbClient.db("mydatabase");

    const remindersCollection = db.collection("reminders");
    const leadsCollection = db.collection("student-leads");
    const businessesCollection = db.collection("businesses");

    // Fetch reminder to get type and targetId
    const reminder = await remindersCollection.findOne({ _id: new ObjectId(id) });
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const { type, targetId } = reminder;

    if (!type || !targetId) {
      return NextResponse.json({ error: "Reminder missing type or targetId" }, { status: 400 });
    }

    // Step 1: Delete the reminder document
    const result = await remindersCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
    }

    // Step 2: Remove from embedded array in the correct collection
    if (type === "lead") {
      await leadsCollection.updateOne(
        { _id: new ObjectId(targetId) },
        //@ts-ignore
        { $pull: { reminders: { _id: new ObjectId(id) } } }
      );
    } else if (type === "business") {
      await businessesCollection.updateOne(
        { _id: new ObjectId(targetId) },
        //@ts-ignore
        { $pull: { reminders: { _id: new ObjectId(id) } } }
      );
    } else {
      return NextResponse.json({ warning: "Reminder deleted but unknown type for cleanup" }, { status: 200 });
    }

    return NextResponse.json({ message: "Reminder deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
