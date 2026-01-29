import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Handle GET requests to READ all forex entries or a specific forex enquiry by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("forex");

    // Extract the forex ID from the request URL if provided
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Validate if the id is a valid ObjectId before querying the database
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      // Fetch a single forex enquiry by ID
      const forex = await collection.findOne({ _id: new ObjectId(id) });

      if (!forex) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(forex);
    } else {
      // Fetch all forex enquiries if no ID is provided
      const forexList = await collection.find({}).toArray();
      return NextResponse.json(forexList);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle POST requests to CREATE a new forex enquiry
export async function POST(request: Request) {
  try {
    // Connect to the MongoDB client
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("forex");

    const { name, email, phoneNumber, action } = await request.json();

    // Basic validation
    if (!name || !email || !phoneNumber || !action) {
      return NextResponse.json(
        { error: "Name, email, mobile, and action are required." },
        { status: 400 }
      );
    }

    // Insert the form data into the 'forex' collection in MongoDB
    const result = await collection.insertOne({
      name,
      email,
      phoneNumber,
      type: "forex", //  default type
      action,
    });

    return NextResponse.json({
      message: "Forex enquiry created successfully",
      result,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle PUT requests to UPDATE an existing forex enquiry
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("forex");

    // Extract the forex ID from the request URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    // Parse the incoming request data
    const { name, email, phoneNumber, action } = await request.json();

    // Ensure there's at least one field to update
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      action: string;
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (action) updates.action = action;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Perform the update
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Forex enquiry updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests to delete a forex enquiry by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("forex");

    // Extract the forex ID from the request URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    // Perform the deletion
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Forex enquiry deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
