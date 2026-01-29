import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Handle GET requests to READ all student entries or a specific student enquiry by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("students");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const batchId = url.searchParams.get("batchId");
    const slotParam = url.searchParams.get("slot"); // expects "Day|Time"

    // 1) Single-student by _id
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
      const student = await collection.findOne({ _id: new ObjectId(id) });
      if (!student) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(student);
    }

    // 2) Filtered list by batchId & slot
    let filter: any = {};
    if (batchId && slotParam) {
      const [day, time] = slotParam.split("|");
      if (!day || !time) {
        return NextResponse.json({ error: "Invalid slot format" }, { status: 400 });
      }
      filter = {
        batches: {
          $elemMatch: {
            id: batchId,
            schedules: {
              $elemMatch: { day, time }
            }
          }
        }
      };
    }

    // 3) Fetch matching students (all if no filter)
    const students = await collection.find(filter).toArray();
    return NextResponse.json(students);

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle POST requests to CREATE a new student enquiry
export async function POST(request: Request) {
  try {
    // Connect to the MongoDB client
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("students");

    const { name, email, phoneNumber, parentPhoneNumber, address, aadhar, regDate, dob, batches } = await request.json();

    // Basic validation
    if (!name || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "Name, email, mobile are required." },
        { status: 400 }
      );
    }

    // Insert the form data into the 'student' collection in MongoDB
    const result = await collection.insertOne({
      name,
      email,
      phoneNumber,
      parentPhoneNumber,
      address,
      aadhar,
      regDate,
      dob,
      batches
    });

    return NextResponse.json({
      message: "Student enquiry created successfully",
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

// Handle PUT requests to UPDATE an existing student enquiry
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("students");

    // Extract the student ID from the request URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    // Parse the incoming request data
    const { name, email, phoneNumber, parentPhoneNumber, address, aadhar, regDate, dob, batches } = await request.json();

    // Ensure there's at least one field to update
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      parentPhoneNumber: string;
      address : string;
      regDate: string;
      dob: string;
      batches: any;
      aadhar: string;
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (parentPhoneNumber) updates.phoneNumber = phoneNumber;
    if (address) updates.address = address;
    if (regDate) updates.regDate = regDate;
    if (dob) updates.dob = dob;
    if (batches) updates.batches = batches;
    if (aadhar) updates.aadhar = aadhar;

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

    return NextResponse.json({ message: "Student enquiry updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests to delete a student enquiry by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("students");

    // Extract the student ID from the request URL
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

    return NextResponse.json({ message: "Student enquiry deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
