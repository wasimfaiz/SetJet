import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

// Handle POST requests to CREATE a new contact
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("contacts");

    const { name, email, phoneNumber, action } = await request.json();

    // Basic validation
    if (!name || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
    const createdAt = new Date(now.getTime() + istOffset);
    const result = await collection.insertOne({
      name,
      email,
      phoneNumber,
      type: "general", // Default value
      action,
      createdAt,
      notified: false
    });

    return NextResponse.json({
      message: "Contact saved successfully",
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
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("contacts");

    // Extract parameters from the request URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");
    const flag = url.searchParams.get("flag"); // Add flag filter
    const page = parseInt(url.searchParams.get("page") || "1", 10); // Default page is 1
    const date = url.searchParams.get("date"); // Specific date for createdAt filter
    const limit = parseInt(url.searchParams.get("limit") || "10", 10); // Number of documents per page

    // Construct the base query object
    const query: any = {};

    // If an id is provided, fetch that specific contact
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const contact = await collection.findOne({ _id: new ObjectId(id) });
      if (!contact) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }
      return NextResponse.json(contact);
    }

    // Apply flag filter if provided
    if (flag) {
      query.flag = flag;
    }

    // For contacts query: if status is provided and it's not "ALL", filter by action
    if (status && status !== "ALL") {
      query.action = status;
    }
    // If status === "ALL" or not provided, do not filter by action for contacts.

    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      // Match the date (ignoring time)
      query.createdAt = {
        $gte: new Date(parsedDate.setUTCHours(0, 0, 0, 0)),
        $lt: new Date(parsedDate.setUTCHours(23, 59, 59, 999)),
      };
    }

    // Handle pagination for contacts query
    const totalDocuments = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);
    const skip = (page - 1) * limit;

    if (page > totalPages && totalPages > 0) {
      return NextResponse.json(
        { error: "Page number exceeds total pages", totalPages },
        { status: 400 }
      );
    }

    const contacts = await collection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // For status counts aggregation, ignore the status filter.
    const aggregationQuery = { ...query };
    delete aggregationQuery.action;

    const statusCountsAggregation = await collection
      .aggregate([
        { $match: aggregationQuery },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ])
      .toArray();

    const totalStatusCount = statusCountsAggregation.reduce(
      (sum, statusObj) => sum + statusObj.count,
      0
    );

    // Calculate total calls (documents with the calledAt key)
    const totalCallsCount = await collection.countDocuments({
      ...aggregationQuery,
      calledAt: { $exists: true },
    });

    // Add "TOTAL CALLS" to the statusCounts array
    const extendedStatusCounts = [
      ...statusCountsAggregation,
      { status: "TOTAL CALLS", count: totalCallsCount },
    ];

    return NextResponse.json({
      contacts,
      totalPages,
      currentPage: page,
      statusCounts: extendedStatusCounts,
      totalStatusCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle PUT requests to UPDATE an existing contact
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("contacts");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const { name, email, phoneNumber, action, calledAt, remark, course, remarkUpdatedAt, notified, statusUpdatedBy } = await request.json();

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
      notified : boolean,
      statusUpdatedBy: string
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (action) updates.action = action;
    if (calledAt) updates.calledAt = calledAt;
    if (remark) updates.remark = remark;
    if (course) updates.course = course;
    if (notified) updates.notified = notified;
    if (remarkUpdatedAt) updates.remarkUpdatedAt = remarkUpdatedAt;
    if (statusUpdatedBy) updates.statusUpdatedBy = statusUpdatedBy;

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
// Handle DELETE requests to delete a contact by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("contacts");

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

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
