import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db();
};

// 🔥 NEW: Create BATCH + SLOTS in ONE API call (for admin panel)
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    console.log("📥 POST /scheduling:", body);

    // 🔥 Check if it's Batch+Slots creation (new frontend flow)
    if (body.batch && Array.isArray(body.slots)) {
      const { batch, slots } = body;

      // 1. Validate batch data
      if (!batch.name || !batch.course) {
        return NextResponse.json({ error: "Batch name and course required" }, { status: 400 });
      }

      // 2. Create BATCH first
      const batchResult = await db.collection("batches").insertOne({
        name: batch.name,
        course: batch.course,
        classType: batch.classType || "Online",
        capacity: batch.capacity || 25,
        facultyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const batchId = batchResult.insertedId;
      console.log("✅ Batch created:", batch.name, batchId);

      // 3. Create SLOTS linked to batch
      const slotResults = [];
      for (const slotData of slots) {
        const { date, timeSlot } = slotData;

        const slotResult = await db.collection("slots").insertOne({
          course: batch.course,
          batch: batchId,
          date,
          timeSlot,
          isActive: true,
          isBooked: false,
          availableSeats: batch.capacity || 25,
          totalSeats: batch.capacity || 25,
          students: [],
          createdAt: new Date(),
        });

        slotResults.push({
          success: true,
          slotId: slotResult.insertedId,
          date,
          timeSlot,
        });
      }

      console.log(`✅ ${slotResults.length} slots created for batch ${batchId}`);

      // 4. Return populated result
      const newBatch = await db.collection("batches").findOne({ 
        _id: batchId 
      });
      
      return NextResponse.json({
        success: true,
        batch: newBatch,
        slotsCreated: slotResults.length,
        slots: slotResults,
        message: `Batch "${batch.name}" created with ${slotResults.length} slots!`,
      });
    }

    // 🔥 OLD FLOW: Add slots to EXISTING batch
    const { batch: batchId, slots } = body;

    if (!batchId || !ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: "Valid batch ID required" }, { status: 400 });
    }

    const batch = await db.collection("batches").findOne({ _id: new ObjectId(batchId) });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: "Invalid slots array" }, { status: 400 });
    }

    console.log(`🆕 Adding ${slots.length} slots to batch ${batch.name}...`);
    const results: any[] = [];

    for (const slotData of slots) {
      const { date, timeSlot } = slotData;
      
      const exists = await db.collection("slots").findOne({
        batch: new ObjectId(batchId),
        date,
        timeSlot,
        isActive: true,
      });

      if (exists) {
        results.push({ success: false, error: "Slot exists", date, timeSlot });
        continue;
      }

      const slotResult = await db.collection("slots").insertOne({
        course: batch.course,
        batch: new ObjectId(batchId),
        date,
        timeSlot,
        isActive: true,
        isBooked: false,
        availableSeats: batch.capacity,
        totalSeats: batch.capacity,
        students: [],
        createdAt: new Date(),
      });

      results.push({
        success: true,
        slotId: slotResult.insertedId,
        date,
        timeSlot,
      });
    }

    return NextResponse.json({
      success: true,
      total: slots.length,
      created: results.filter(r => r.success).length,
      results,
    });

  } catch (err) {
    console.error("❌ POST /scheduling ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET - Fetch batches or slots (unchanged)
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const isPublic = searchParams.get("public") === "true";

    if (id && ObjectId.isValid(id)) {
      const collection = type === "batches" ? "batches" : "slots";
      const item = await db.collection(collection).findOne({ _id: new ObjectId(id) });
      return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (type === "batches") {
      const batches = await db.collection("batches").find().toArray();
      return NextResponse.json(batches);
    }

    // SLOTS with batch population
    const filter: any = { isActive: true };
    const slots = await db.collection("slots")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "batches",
            localField: "batch",
            foreignField: "_id",
            as: "batchInfo"
          }
        },
        { $unwind: { path: "$batchInfo", preserveNullAndEmptyArrays: true } },
        { $sort: { date: 1 } }
      ])
      .toArray();
      
    return NextResponse.json({ success: true, slots });
  } catch (err) {
    console.error("GET /scheduling error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// PUT & DELETE remain unchanged...
export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || updates.id;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const collection = updates.isActive !== undefined ? "slots" : "batches";
    
    const result = await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: `${collection.slice(0,-1)} updated` });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const collection = type === "batch" ? "batches" : "slots";
    const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
