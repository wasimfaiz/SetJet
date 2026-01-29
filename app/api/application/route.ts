import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Handle GET requests to fetch all applications or a specific one by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("applications");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const app = await collection.findOne({ _id: new ObjectId(id) });
      if (!app) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }
      return NextResponse.json(app);
    } else {
      const items = await collection
        .find({})
        .sort({ createdAt: -1 }) // ✅ Sort latest first
        .toArray();

      return NextResponse.json(items);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}


// Handle POST requests to create a new application
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("applications");

    const data = await request.json();

    // Insert the application data as-is (or validate if needed)
    const result = await collection.insertOne(data);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}

// Handle PUT requests to update an application by ID
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("applications");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Application updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}

// Handle DELETE requests to delete an application by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("applications");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.error();
  }
}
