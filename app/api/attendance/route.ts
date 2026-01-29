// app/api/attendance/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// helper to parse and validate `id` query param
function parseId(req: Request): ObjectId | null {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function GET(req: Request) {
  const client = await clientPromise;
  const db = client.db();
  const url = new URL(req.url);
  
  // Exact document lookup by its _id
  const idParam = url.searchParams.get('id');
  if (idParam) {
    if (!ObjectId.isValid(idParam)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const rec = await db.collection('attendance').findOne({ _id: new ObjectId(idParam) });
    if (!rec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rec);
  }

  // Filter by batchId if provided
  const batchId = url.searchParams.get('batchId');
  let filter = {};
  if (batchId) {
    if (!ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: 'Invalid batchId format' }, { status: 400 });
    }
    filter = { 'batchId': batchId };
  }

  // Fetch and sort
  const records = await db
    .collection('attendance')
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(records);
}


export async function POST(req: Request) {
  try {
    const db = (await clientPromise).db();
    const payload = await req.json();
    const now = new Date();
    const doc = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("attendance").insertOne(doc);
    return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/attendance", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const id = parseId(req);
  if (!id) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  try {
    const payload = await req.json();
    const now = new Date();
    const updateDoc: any = {
      ...payload,
      updatedAt: now,
    };
    if (payload.date) updateDoc.date = new Date(payload.date);

    const db = (await clientPromise).db();
    const result = await db
      .collection("attendance")
      .updateOne({ _id: id }, { $set: updateDoc });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("PUT /api/attendance", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = parseId(req);
  if (!id) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  try {
    const db = (await clientPromise).db();
    const result = await db.collection("attendance").deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error("DELETE /api/attendance", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
