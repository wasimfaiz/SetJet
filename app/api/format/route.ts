import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs"; // Use bcrypt for password hashing

// Function to connect to MongoDB and get the formats collection
async function getFormatsCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("formats");
}

// POST API - Create Format
export async function POST(request: Request) {
  try {
    const formatData = await request.json();
    // const hashedPassword = await bcrypt.hash(formatData.password, 10);

    const formatsCollection = await getFormatsCollection();
    const result = await formatsCollection.insertOne({
      ...formatData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "format created successfully",
      formatId: result.insertedId, // Include the format ID in the response
    });
  } catch (error) {
    console.error("Failed to create format:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API - Fetch Format by ID or Get All Formats
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");

  try {
    const formatsCollection = await getFormatsCollection();

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid format ID" },
          { status: 400 }
        );
      }

      const format = await formatsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!format) {
        return NextResponse.json(
          { error: "Format not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(format, { status: 200 });
    } else if (email) {
      const format = await formatsCollection.findOne({
        "basicField.email": email,
      });
      if (!format) {
        return NextResponse.json(
          { error: "Format not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(format, { status: 200 });
    } else {
      // If neither id nor email is provided, return all formats
      const formats = await formatsCollection.find().toArray();
      return NextResponse.json(formats, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching format:", error);
    return NextResponse.json(
      { error: "Failed to fetch format" },
      { status: 500 }
    );
  }
}
// PUT API - Update Format by ID
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
    // If updating the password, hash it before saving
    // if (updates.password) {
    //   updates.password = await bcrypt.hash(updates.password, 10);
    // }

    const formatsCollection = await getFormatsCollection();
    const result = await formatsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "format updated successfully" });
  } catch (error) {
    console.error("Failed to update format:", error);
    return NextResponse.json(
      { error: "Failed to update format" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete Format by ID
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  try {
    const formatsCollection = await getFormatsCollection();
    const result = await formatsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No format found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Format deleted successfully" });
  } catch (error) {
    console.error("Failed to delete format:", error);
    return NextResponse.json(
      { error: "Failed to delete format" },
      { status: 500 }
    );
  }
}
