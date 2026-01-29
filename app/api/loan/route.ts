import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all loan entries or a specific loan entry by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("loans");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Validate if the id is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      // Fetch a single loan entry by ID
      const loan = await collection.findOne({ _id: new ObjectId(id) });

      if (!loan) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(loan);
    } else {
      // Fetch all loan entries if no ID is provided
      const loanList = await collection.find({}).toArray();
      return NextResponse.json(loanList);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create a new loan entry
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("loans");

    const { name, email, phoneNumber, course, action } = await request.json();

    // Basic validation
    if (!name || !email || !phoneNumber || !course) {
      return NextResponse.json(
        { error: "Name, email, phone number, and course are required." },
        { status: 400 }
      );
    }

    // Insert the data into the MongoDB collection with a default 'type' of 'loan'
    const result = await collection.insertOne({
      name,
      email,
      phoneNumber,
      course, // PG/UG
      action,
      type: "loan",
    });

    return NextResponse.json({
      message: "Loan enquiry saved successfully",
      result,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Update a loan entry by ID
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("loans");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const { name, email, phoneNumber, course, action } = await request.json();

    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      course: string;
      action: string;
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (course) updates.course = course;
    if (action) updates.action = action;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update the loan entry by ID
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

    return NextResponse.json({ message: "Loan enquiry updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a loan entry by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("loans");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    // Delete the loan entry by ID
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Loan enquiry deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
