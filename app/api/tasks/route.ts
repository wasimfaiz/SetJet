import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import axios from "axios";

// Handle GET requests to fetch all task or a specific task by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("tasks");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const employeeId = url.searchParams.get("employeeId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    // Fetch by document ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const task = await collection.findOne({ _id: new ObjectId(id) });

      if (!task) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(task, { status: 200 });
    }

    // Build query object dynamically
    const query: any = {};
    if (employeeId) {
      query["employee.id"] = employeeId;
    }
    if (status) {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "employee.name": { $regex: search, $options: "i" } },
        { "employee.email": { $regex: search, $options: "i" } },
        { "by.employeeName": { $regex: search, $options: "i" } },
        { "by.employeeEmail": { $regex: search, $options: "i" } },
      ];
    }

    // Get total count based on the query (filtered by search or employeeId)
    const totalCount = await collection.countDocuments(query);

    // Calculate total pages based on filtered totalCount
    const totalPages = Math.ceil(totalCount / limit);

    // Pagination logic: calculate documents to skip
    const skip = (page - 1) * limit;

    // Fetch paginated tasks based on query
    const tasks = await collection
      .find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .skip(skip)
      .limit(limit)
      .toArray();

    // Reverse the order for pagination to show the most recent first

    return NextResponse.json(
      {
        tasks, // Paginated tasks for the current page
        totalCount, // Total tasks matching the query (independent of pagination)
        totalPages, // Total pages based on filtered totalCount and limit
        currentPage: page, // Current page number
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle POST requests to CREATE a new task
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("tasks");

    const { name, desc, priority, status, by, employee, img } =
      await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const createdAt = new Date(now.getTime() + istOffset);

    const newTask = {
      name,
      desc,
      priority,
      status,
      createdAt,
      by,
      employee,
      img,
    };

    const result = await collection.insertOne(newTask);

    // Emit socket event via external socket server
    try {
      const socketServerUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

      await axios.post(`${socketServerUrl}/emit-task-event`, {
        event: "newTask",
        room: employee?.id || null,
        data: {
          _id: result.insertedId,
          ...newTask,
        },
      });
    } catch (emitErr) {
      console.error("Socket event emit failed:", emitErr);
    }

    return NextResponse.json(
      {
        message: "Task saved successfully",
        result,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const collection = db.collection("tasks");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  try {
    // Find the task before deleting it
    const taskToDelete = await collection.findOne({ _id: new ObjectId(id) });

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No task found with that ID" },
        { status: 404 }
      );
    }

    // Emit Socket.IO event after successfully deleting the task
    const io = global._io; // Access the Socket.IO instance
    if (io) {
      io.emit("taskDeleted", taskToDelete); // Emit the 'taskDeleted' event globally
      //io.to(taskToDelete.employee.id).emit("taskDeleted", { taskId: id }); //Emit to a specific employee
    }

    return NextResponse.json({ message: "task deleted successfully" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("tasks");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    // Remove _id to avoid immutable field error
    const { _id, ...updateData } = body;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch updated task
    const updatedTask = await collection.findOne({ _id: new ObjectId(id) });

    // Emit update event to socket server
    try {
      const socketServerUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
      const emitUrl = `${socketServerUrl}/emit-task-event`;
      console.log("➡️ Emitting to:", emitUrl);

      const emitResponse = await axios.post(emitUrl, {
        event: "task-updated",
        //@ts-ignore
        room: updatedTask.employee?.id || null,
        data: updatedTask,
      });

      console.log("✅ Emit response:", emitResponse.data);
    } catch (emitErr: any) {
      console.error("❌ Socket event emit failed:", emitErr.message);
    }

    return NextResponse.json(
      { message: "Document updated successfully" },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error occurred during PUT operation:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
