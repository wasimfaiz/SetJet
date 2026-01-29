// app/api/contact/route.ts
import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Function to connect to MongoDB and get the visits collection
async function getCheckoutCollection() {
  const client = await clientPromise; // Using clientPromise for connection
  const db = client.db("mydatabase");
  return db.collection("payments");
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("payments");
    const contactCollection = await getCheckoutCollection();

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }

      const payment = await collection.findOne({ _id: new ObjectId(id) });

      if (!payment) {
        return NextResponse.json({ error: "No document found with that ID" }, { status: 404 });
      }

      return NextResponse.json(payment, { status: 200 });
    } else {
      // Calculate pagination
      const totalDocuments = await collection.countDocuments();
      const totalPages = Math.ceil(totalDocuments / limit);
      const skip = (page - 1) * limit;

      if (page > totalPages && totalPages > 0) {
        return NextResponse.json(
          { error: "Page number exceeds total pages", totalPages },
          { status: 400 }
        );
      }

      const payments = await collection
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Aggregate payment status counts
      const statusCounts = await collection
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

      // Get total from contact collection
      const totalCount = await contactCollection.countDocuments();

      return NextResponse.json(
        {
          contacts: payments,
          totalPages,
          currentPage: page,
          statusCounts,
          totalStatusCount: totalCount,
        },
        { status: 200 }
      );
    }
  } catch (e) {
    console.error("Error fetching payments:", e);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("payments");

    const { name, email, phoneNumber, duration } = await request.json();

    // Basic validation (you can extend this as needed)
    if (!name || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "Name, email, phone number and duration are required." },
        { status: 400 }
      );
    }

    // Insert the data into the MongoDB collection with a default 'type' of 'general'
    const result = await collection.insertOne({
      name,
      email,
      phoneNumber,
      duration,
      type: "payment", // Default value
      notified: false
    });

    return NextResponse.json({ message: "Proceed to checkout page", result });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// Handle DELETE requests to delete a checkout by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("payments");

    // Extract the contact ID from the request URL
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

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// Handle PUT requests to UPDATE an existing checkout
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("payments");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const { name, email, phoneNumber, action, calledAt, remark, course, remarkUpdatedAt } = await request.json();

    // Create updates object
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      action: string;
      calledAt: any;
      remark: any;
      remarkUpdatedAt: any;
      course: string;
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (action) updates.action = action;
    if (calledAt) updates.calledAt = calledAt;
    if (remark) updates.remark = remark;
    if (course) updates.course = course;
    if (remarkUpdatedAt) updates.remarkUpdatedAt = remarkUpdatedAt;

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

    return NextResponse.json({ message: "Contact updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
