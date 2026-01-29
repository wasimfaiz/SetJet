import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Function to connect to MongoDB and get the visits collection
async function getVisitsCollection() {
  const client = await clientPromise; // Using clientPromise for connection
  const db = client.db("mydatabase");
  return db.collection("visit");
}

// POST API - Create Visit
export async function POST(request: Request) {
  try {
    const { name, email, phoneNumber, date, time, address, action } =
      await request.json();

    // Basic validation (make sure all fields are filled)
    if (!name || !email || !phoneNumber || !date || !time || !address) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Insert the data into the MongoDB collection
    const visitsCollection = await getVisitsCollection();
    const result = await visitsCollection.insertOne({
      name,
      email,
      phoneNumber,
      type: "general", // Default value
      date,
      time,
      address,
      action,
    });

    return NextResponse.json({
      message: "Visit details saved successfully",
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10); // Make limit dynamic

  try {
    const visitsCollection = await getVisitsCollection();

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }

      const visit = await visitsCollection.findOne({ _id: new ObjectId(id) });

      if (!visit) {
        return NextResponse.json({ error: "Visit not found" }, { status: 404 });
      }

      return NextResponse.json(visit, { status: 200 });
    } else {
      const totalDocuments = await visitsCollection.countDocuments();
      const totalPages = Math.ceil(totalDocuments / limit);
      const skip = (page - 1) * limit;

      if (page > totalPages && totalPages > 0) {
        return NextResponse.json(
          { error: "Page number exceeds total pages", totalPages },
          { status: 400 }
        );
      }

      const visits = await visitsCollection
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const statusCounts = await visitsCollection
        .aggregate([
          {
            $group: {
              _id: "$action",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              status: "$_id",
              count: 1,
              _id: 0,
            },
          },
        ])
        .toArray();

      const totalStatusCount = await visitsCollection.countDocuments();

      return NextResponse.json(
        {
          contacts: visits,
          totalPages,
          currentPage: page,
          statusCounts,
          totalStatusCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching visit:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit" },
      { status: 500 }
    );
  }
}


// PUT API - Update Visit by ID
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  const {
    name,
    email,
    phoneNumber,
    date,
    time,
    address,
    action,
    calledAt,
    remark,
    course,
    notified,
    remarkUpdatedAt,
    statusUpdatedBy,
  }: Partial<{
    name: string;
    email: string;
    phoneNumber: string;
    date: string;
    time: string;
    address: string;
    action: string;
    calledAt: any;
    remark: any;
    remarkUpdatedAt: any;
    course: string;
    notified: boolean;
    statusUpdatedBy: any;
  }> = await request.json();

  try {
    const visitsCollection = await getVisitsCollection();
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      date: string;
      time: string;
      address: string;
      action: string;
      calledAt: any;
      remark: any;
      remarkUpdatedAt: any;
      course: string;
      notified: boolean;
      statusUpdatedBy: any;
    }> = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (action) updates.action = action;
    if (address) updates.address = address;
    if (calledAt) updates.calledAt = calledAt;
    if (remark) updates.remark = remark;
    if (course) updates.course = course;
    if (notified) updates.notified = notified;
    if (remarkUpdatedAt) updates.remarkUpdatedAt = remarkUpdatedAt;
    if (statusUpdatedBy) updates.statusUpdatedBy = statusUpdatedBy;

    const result = await visitsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No visit found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Visit updated successfully" });
  } catch (error) {
    console.error("Failed to update visit:", error);
    return NextResponse.json(
      { error: "Failed to update visit" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete Visit by ID
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
    const visitsCollection = await getVisitsCollection();
    const result = await visitsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No visit found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Failed to delete visit:", error);
    return NextResponse.json(
      { error: "Failed to delete visit" },
      { status: 500 }
    );
  }
}
