import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET: Fetch all course names
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const courses = await db.collection("courseNames").find({}).toArray();
    const names = courses.map((course) => course.name);
    return NextResponse.json(names);
  } catch (error) {
    console.error("Error fetching course names:", error);
    return NextResponse.json({ error: "Failed to fetch course names" }, { status: 500 });
  }
}

// POST: Add a new course name
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid course name" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("courseNames").findOne({ name });

    if (existing) {
      return NextResponse.json({ message: "Course already exists" }, { status: 200 });
    }

    await db.collection("courseNames").insertOne({ name });

    return NextResponse.json({ message: "Course added" });
  } catch (error) {
    console.error("Error adding course name:", error);
    return NextResponse.json({ error: "Failed to add course name" }, { status: 500 });
  }
}

// Handle DELETE requests to delete a course by ID
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
    const courses = db.collection("courseNames"); // or your collection name

    const result = await courses.deleteOne({ name });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: `No course found with name "${name}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Deleted course "${name}"` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting course by name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}