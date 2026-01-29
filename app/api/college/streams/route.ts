import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET: Fetch all stream names
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const streams = await db.collection("streamNames").find({}).toArray();
    const names = streams.map((stream) => stream.name);
    return NextResponse.json(names);
  } catch (error) {
    console.error("Error fetching stream names:", error);
    return NextResponse.json({ error: "Failed to fetch stream names" }, { status: 500 });
  }
}

// POST: Add a new stream name
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid stream name" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("streamNames").findOne({ name });

    if (existing) {
      return NextResponse.json({ message: "Stream already exists" }, { status: 200 });
    }

    await db.collection("streamNames").insertOne({ name });

    return NextResponse.json({ message: "Stream added" });
  } catch (error) {
    console.error("Error adding stream name:", error);
    return NextResponse.json({ error: "Failed to add stream name" }, { status: 500 });
  }
}

// Handle DELETE requests to delete a stream by ID
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) {
    return NextResponse.json(
      { error: "Missing `name` query parameter" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const streams = db.collection("streamNames"); // or your collection name

    const result = await streams.deleteOne({ name });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: `No stream found with name "${name}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Deleted stream "${name}"` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting stream by name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}