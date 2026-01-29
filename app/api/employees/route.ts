import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs"; // Use bcrypt for password hashing

// Function to connect to MongoDB and get the employees collection
async function getEmployeesCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("employees");
}

// POST API - Create Employee
export async function POST(request: Request) {
  try {
    const employeeData = await request.json();
    // const hashedPassword = await bcrypt.hash(employeeData.password, 10);

    const employeesCollection = await getEmployeesCollection();
    const result = await employeesCollection.insertOne({
      ...employeeData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "employee created successfully",
      employeeId: result.insertedId, // Include the employee ID in the response
    });
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API - Fetch Employee by ID or Get All Employees
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const searchTerm = url.searchParams.get("searchTerm");
  const location = url.searchParams.get("location");
  const status = url.searchParams.get("status");

  // Check if both page and limit are present
  const hasPagination = url.searchParams.has("page") && url.searchParams.has("limit");
  const page = hasPagination ? parseInt(url.searchParams.get("page") || "1", 10) : 1;
  const limit = hasPagination ? parseInt(url.searchParams.get("limit") || "10", 10) : 0;

  try {
    const employeesCollection = await getEmployeesCollection();

    // If an id is provided, return the single employee
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid employee ID" },
          { status: 400 }
        );
      }
      const employee = await employeesCollection.findOne({ _id: new ObjectId(id) });
      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(employee, { status: 200 });
    }

    // If an email is provided, return the single employee
    if (email) {
      const employee = await employeesCollection.findOne({ "basicField.email": email });
      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(employee, { status: 200 });
    }

    // Build the query (for search or get all)
    let query: any = {};
    if (searchTerm) {
      console.log("Search Term:", searchTerm);
      query = {
        $or: [
          { "basicField.name": { $regex: searchTerm, $options: "i" } },
          { "basicField.email": { $regex: searchTerm, $options: "i" } },
        ],
      };
      console.log("Search Query:", query);
    }
    if (location) {
      query["basicField.jobLocation"] = location;
    }
    if (status) {
      query["basicField.status"] = status;
    }
    if (hasPagination) {
      // Apply pagination if both page and limit are provided
      const totalEmployees = await employeesCollection.countDocuments(query);
      const totalPages = Math.ceil(totalEmployees / limit);

      const employees = await employeesCollection
        .find(query)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      if (!employees || employees.length === 0) {
        return NextResponse.json({ error: "No employees found" }, { status: 404 });
      }

      return NextResponse.json(
        { employees, totalEmployees, totalPages, page, limit },
        { status: 200 }
      );
    } else {
      // If no pagination parameters, return the employees array directly
      const employees = await employeesCollection.find(query).sort({ _id: -1 }).toArray();

      if (!employees || employees.length === 0) {
        return NextResponse.json({ error: "No employees found" }, { status: 404 });
      }

      return NextResponse.json(employees, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
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
    // If updating the password, hash it before saving
    // if (updates.password) {
    //   updates.password = await bcrypt.hash(updates.password, 10);
    // }

    const employeesCollection = await getEmployeesCollection();
    const result = await employeesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "employee updated successfully" });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
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
    const employeesCollection = await getEmployeesCollection();
    const result = await employeesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No employee found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
