import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
    try {
      const client = await clientPromise;
      const db = client.db("mydatabase");
      const collection = db.collection("admissions");
      // Extract params from the request URL
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      const status = url.searchParams.get("status");
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
  
      // For contacts query: if status is provided and it's not "ALL", filter by action
      if (status && status !== "ALL") {
        if (status === "TOTAL CALLS") {
          query.calledAt = { $exists: true };
        } else {
          query.status = status;
        }
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
  
      const admissions = await collection
        .find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
  
        const aggregationQuery = { ...query };
        delete aggregationQuery.status;
        delete aggregationQuery.calledAt;        
  
      const statusCountsAggregation = await collection
        .aggregate([
          { $match: aggregationQuery },
          { $group: { _id: "$status", count: { $sum: 1 } } },
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
        admissions,
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

export async function PUT(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("admissions");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    const body = await req.json();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No document updated" }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("admissions");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "No document found to delete" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}




