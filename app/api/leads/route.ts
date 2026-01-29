import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the import based on your project structure
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("leads");

    const employees = await collection.find({}).toArray();
    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, employeeName } = body;

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { message: "Missing required fields: employeeId or employeeName" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("leads");

    // Check collection count for debugging
    const count = await collection.countDocuments();
    console.log("Number of documents in leads:", count);

    // Check if employeeId exists
    console.log("Searching for employeeId:", employeeId);
    const existingEmployee = await collection.findOne({ employeeId });
    console.log("Existing Employee:", existingEmployee);

    if (existingEmployee) {
      return NextResponse.json(
        { message: "Employee with this ID already exists" },
        { status: 200 }
      );
    }

    const result = await collection.insertOne({
      employeeId,
      employeeName,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Employee added successfully", result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase"); // Replace with your database name
    const leadsCollection = db.collection("leads");
    const studentLeadsCollection = db.collection("student-leads");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Find and delete the lead
    const leadToDelete = await leadsCollection.findOneAndDelete({
      _id: new ObjectId(id),
    });

    console.log("Lead to delete:", leadToDelete);

    // Check if a lead was actually deleted
    if (!leadToDelete) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Extract the employeeId from the deleted lead
    const { employeeId } = leadToDelete;

    if (employeeId) {
      // Delete related documents from the student-leads collection
      const studentLeadsDeletionResult = await studentLeadsCollection.deleteMany({
        "by.employeeId": employeeId,
      });

      return NextResponse.json({
        message: "Lead and associated student-leads deleted successfully",
        leadDeleted: 1,
        studentLeadsDeleted: studentLeadsDeletionResult.deletedCount,
      });
    }

    return NextResponse.json({
      message: "Lead deleted, but no associated student-leads found",
      leadDeleted: 1,
      studentLeadsDeleted: 0,
    });
  } catch (error) {
    console.error("Error deleting lead and associated student-leads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

