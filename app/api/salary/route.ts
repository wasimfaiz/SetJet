import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Function to connect to MongoDB and get the salary collection
async function getSalaryCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("salary");
}

// POST API - Create salary slip
export async function POST(request: Request) {
  try {
    const salaryData = await request.json();

    const salaryCollection = await getSalaryCollection();
    const result = await salaryCollection.insertOne({
      ...salaryData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "Salary slip saved successfully",
      id: result.insertedId, // Include the _id in the response
    });
  } catch (error) {
    console.error("Failed to create salary slip:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API - Fetch Employee by ID or Get All Employees
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = new URL(request.url);

  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const search = searchParams.get("search");
  const date = searchParams.get("date");

  try {
    const salaryCollection = await getSalaryCollection();

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid salary slip ID" },
          { status: 400 }
        );
      }

      const salary = await salaryCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!salary) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(salary, { status: 200 });
    } else {
      // If neither id nor email is provided, return all employees
    let filter: any = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");// 'i' for case-insensitive
      filter = {
        $or: [
          { employeeName: { $regex: searchRegex } },
          { designation: { $regex: searchRegex } },
          { employeeId: { $regex: searchRegex } },
        ],
      };
    }

    if (date) {
        filter.salaryDate = date; //Exact match if salaryDate is "YYYY-MM-DD" string
      }

    // Fetch the salaries based on the filter
    const salaries = await salaryCollection.find(filter).toArray();

    salaries.reverse();
    return NextResponse.json(salaries, { status: 200 });
}} catch (error) {
    console.error("Error fetching salary slip:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary slip" },
      { status: 500 }
    );
  }
}
// PUT API - Update Employee by ID
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
    const salaryCollection = await getSalaryCollection();
    const result = await salaryCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No salary slip found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Salary slip updated successfully",
      id,
    });
  } catch (error) {
    console.error("Failed to update salary slip:", error);
    return NextResponse.json(
      { error: "Failed to update salary slip" },
      { status: 500 }
    );
  }
}


// DELETE API - Delete Employee by ID
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
    const salaryCollection = await getSalaryCollection();
    const result = await salaryCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No salary slip found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "salary slip deleted successfully" });
  } catch (error) {
    console.error("Failed to delete salary slip:", error);
    return NextResponse.json(
      { error: "Failed to delete salary slip" },
      { status: 500 }
    );
  }
}
