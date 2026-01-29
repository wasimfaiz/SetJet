import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Handle POST requests to CREATE a new job
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("jobs");

    const { title, location, salary, jobType, desc } = await request.json();

    // Basic validation
    if (!title || !location || !salary) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const result = await collection.insertOne({
      title,
      location,
      salary,
      jobType,
      desc,
    });

    return NextResponse.json({
      message: "Job saved successfully",
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
// Handle READ requests to fetch all jobs or a specific job by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("jobs");

    // Extract the job ID from the request URL if provided
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

      // Fetch a single job by ID
      const job = await collection.findOne({ _id: new ObjectId(id) });

      if (!job) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(job);
    } else {
      // Fetch all jobs if no ID is provided
      const jobs = await collection.find({}).toArray();
      return NextResponse.json(jobs);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// Handle PUT requests to UPDATE an existing job
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("jobs");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const { title, company, location, salary, jobType, desc, action } =
      await request.json();
    // Create updates object
    const updates: Partial<{
      title: string;
      company: string;
      location: string;
      salary: string;
      jobType: string;
      desc: string;
      action: string;
    }> = {};
    if (title) updates.title = title;
    if (location) updates.location = location;
    if (salary) updates.salary = salary;

    if (jobType) updates.jobType = jobType;
    if (desc) updates.desc = desc;

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

    return NextResponse.json({ message: "Job updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// Handle DELETE requests to delete a job by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("jobs");

    // Extract the job ID from the request URL
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

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
