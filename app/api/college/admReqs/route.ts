import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET: Fetch all admReq names
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const admReqs = await db.collection("admReqs").find({}).toArray();
    const names = admReqs.map((admReq) => admReq.name);
    return NextResponse.json(names);
  } catch (error) {
    console.error("Error fetching admReq names:", error);
    return NextResponse.json({ error: "Failed to fetch admReq names" }, { status: 500 });
  }
}

// POST: Add a new admReq name
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid admReq name" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("admReqs").findOne({ name });

    if (existing) {
      return NextResponse.json({ message: "admReq already exists" }, { status: 200 });
    }

    await db.collection("admReqs").insertOne({ name });

    return NextResponse.json({ message: "admReq added" });
  } catch (error) {
    console.error("Error adding admReq name:", error);
    return NextResponse.json({ error: "Failed to add admReq name" }, { status: 500 });
  }
}

// Handle DELETE requests to delete a admReq by ID
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
    const admReqs = db.collection("admReqs"); // or your collection name

    const result = await admReqs.deleteOne({ name });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: `No admReq found with name "${name}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Deleted admReq "${name}"` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting admReq by name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}