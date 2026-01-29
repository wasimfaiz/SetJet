import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb"; // Adjust the path if necessary

// Define the required headers for the student data
const REQUIRED_HEADERS = ["name", "email", "phoneNumber", "state", "to"]; // Update these as needed

// Handle POST requests to import data into the student-database collection
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

    // Extract the contact ID from the request URL if provided
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' parameter." },
        { status: 400 }
      );
    }

    const students = await request.json();

    // Basic validation to check if students data is an array
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of student records." },
        { status: 400 }
      );
    }

    // Check if all required headers are present in the first student object
    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !(header in students[0])
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(", ")}` },
        { status: 400 }
      );
    }

    // Iterate through the students array and add the databaseId field to each student
    const updatedStudents = students.map((student) => ({
      ...student,
      databaseId: id, // Add the 'databaseId' field with the value of the id from the URL params
    }));

    // Insert multiple documents in bulk
    const result = await collection.insertMany(updatedStudents);

    return NextResponse.json({
      message: "Data imported successfully",
      insertedCount: result.insertedCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
