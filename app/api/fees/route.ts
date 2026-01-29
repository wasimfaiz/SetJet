import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const client = await clientPromise;
  const db = client.db("your_db_name");

  if (id) {
    const fee = await db.collection("fees").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(fee);
  } else {
    const all = await db.collection("fees").find().toArray();
    return NextResponse.json(all);
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  const client = await clientPromise;
  const db = client.db("your_db_name");
  data.createdAt = new Date();
  const res = await db.collection("fees").insertOne(data);
  return NextResponse.json({ ...data, _id: res.insertedId });
}

export async function PUT(request: Request) {
  const client = await clientPromise;
  const db = client.db();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
  }

  const data = await request.json();

  // Now id is non-null and valid:
  await db
    .collection("fees")
    .updateOne({ _id: new ObjectId(id) }, { $set: data });

  return NextResponse.json({ ...data, _id: id });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // 1) Validate presence
  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  // 2) Validate format
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid id format" },
      { status: 400 }
    );
  }

  // 3) Perform deletion
  const client = await clientPromise;
  const db = client.db("fees");
  const result = await db
    .collection("fees")
    .deleteOne({ _id: new ObjectId(id) });

  // 4) If no document was deleted, return 404
  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "No fee record found with that id" },
      { status: 404 }
    );
  }

  // 5) Success
  return NextResponse.json({ success: true });
}
