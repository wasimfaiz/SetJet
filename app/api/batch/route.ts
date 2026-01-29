// app/api/Batch/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("batches");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const doc = await col.findOne({ _id: new ObjectId(id) });
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(doc);
    }

    const all = await col.find().toArray();
    return NextResponse.json(all);
  } catch (err) {
    console.error("Batch GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("batches");

    const result = await col.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await col.findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Batch POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const updates = await request.json();

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || updates.id;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const employeesCollection = db.collection("batches");
    const result = await employeesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "employee updated successfully" });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("batches");

    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Batch DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
