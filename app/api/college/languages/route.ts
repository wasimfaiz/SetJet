import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET: Fetch all language names
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const languages = await db.collection("languages").find({}).toArray();
    const names = languages.map((language) => language.name);
    return NextResponse.json(names);
  } catch (error) {
    console.error("Error fetching language names:", error);
    return NextResponse.json({ error: "Failed to fetch language names" }, { status: 500 });
  }
}

// POST: Add a new language name
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid language name" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("languages").findOne({ name });

    if (existing) {
      return NextResponse.json({ message: "language already exists" }, { status: 200 });
    }

    await db.collection("languages").insertOne({ name });

    return NextResponse.json({ message: "language added" });
  } catch (error) {
    console.error("Error adding language name:", error);
    return NextResponse.json({ error: "Failed to add language name" }, { status: 500 });
  }
}

// Handle DELETE requests to delete a language by ID
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
    const languages = db.collection("languages"); // or your collection name

    const result = await languages.deleteOne({ name });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: `No language found with name "${name}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Deleted language "${name}"` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting language by name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}