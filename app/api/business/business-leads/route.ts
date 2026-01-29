import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb"; 
import { ObjectId } from "mongodb";

const COLLECTION = "business-leads";

export async function POST(request: Request) {
  const data = await request.json();
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const result = await db.collection(COLLECTION).insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return NextResponse.json({ id: result.insertedId });
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("business-leads");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const businessId = url.searchParams.get("businessId");
    const status = url.searchParams.get("status") || "ALL";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const searchTerm = url.searchParams.get("searchTerm");
    const employeeId = url.searchParams.get("employeeId");
    const date = url.searchParams.get("date");
    const calledAtDate = url.searchParams.get("calledAtDate");
    const itemsPerPage = parseInt(url.searchParams.get("limit") || "10", 10);
    const course = url.searchParams.get("course");
    const assignId = url.searchParams.get("assignId");

    // If an ID is provided, return that document only.
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
      const business = await collection.findOne({ _id: new ObjectId(id) });
      if (!business) {
        return NextResponse.json({ error: "No business found with that ID" }, { status: 404 });
      }
      return NextResponse.json(business);
    }

    // Build the main query.
    const query: any = {};

    if (status === "TOTAL CALLS") {
      query.calledAt = { $exists: true };
    } else if (status !== "ALL") {
        query.status = status;
      }

    if (employeeId) {
      query.by= employeeId;
    }
    if (assignId) {
      query.to= assignId;
    }
    if (businessId) {
      query.businessId = businessId;
    }
    if (course) {
      query.course = course;
    }
    if (searchTerm) {
      const searchString = searchTerm.toString();
      query.$or = [
        { name: { $regex: searchString, $options: "i" } },
        { email: { $regex: searchString, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" },
              regex: searchString,
              options: "i",
            },
          },
        },
      ];
    }
    if (date) {
      query.$expr = { $eq: [{ $substr: ["$createdAt", 0, 10] }, date] };
    }
    if (calledAtDate) {
      query.$expr = { $eq: [{ $substr: ["$calledAt", 0, 10] }, calledAtDate] };
    }


    // Get total count based on the main query.
    const totalCount = await collection.countDocuments(query);

    // Apply sorting and pagination.
    let businesses;
    if (url.searchParams.has("page") && url.searchParams.has("limit")) {
      const skip = (page - 1) * itemsPerPage;
      businesses = await collection.find(query).skip(skip).limit(itemsPerPage).toArray();
    } else {
      businesses = await collection.find(query).toArray();
    }

    // Aggregation: clone the query and remove the status filter so that we count all statuses
    const aggregationQuery = { ...query };
    if (aggregationQuery.status) {
      delete aggregationQuery.status;
    }
    const statusAggregation = await collection.aggregate([
      { $match: aggregationQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const formattedStatusCounts = statusAggregation.reduce((acc, item) => {
      acc[item._id || "UNKNOWN"] = item.count;
      return acc;
    }, {});

    // Count total calls (documents with a 'calledAt' field)
    const totalCallsQuery = { ...query };
    if (totalCallsQuery.status) {
      delete totalCallsQuery.status;
    }
    totalCallsQuery.calledAt = { $exists: true };
    const totalCallsCount = await collection.countDocuments(totalCallsQuery);
    formattedStatusCounts["TOTAL CALLS"] = totalCallsCount;

    // Count transfer leads (where transferAt exists)
    const transferCount = await collection.countDocuments({
      ...query,
      transferAt: { $exists: true },
    });

    return NextResponse.json(
      {
        businesses,
        totalCount,
        totalStatusCount: formattedStatusCounts,
        page,
        totalPages: Math.ceil(totalCount / itemsPerPage),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

//individual PUT
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("business-leads");

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
      status,
      statusUpdatedAt,
      calledAt,
      course,
      remark,
      remarkUpdatedAt,
      date,
      tenthPercent,
      twelfthPercent,
      ugPercent,
      pgPercent,
      country,
      gender,
      counsellorName,
      address,
      reminders,
      profilePic,
      leadCategory,
      transferTo,
      transferFrom,
      transferAt,
      to,
    } = await request.json();

    // Create updates object
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      calledAt: any;
      status: string;
      course: string;
      remark: any;
      remarkUpdatedAt: any;
      statusUpdatedAt: string;
      date: string;
      tenthPercent: string;
      twelfthPercent: string;
      ugPercent: string;
      pgPercent: string;
      country: string;
      gender: string;
      counsellorName: string;
      reminders: any;
      address: string;
      profilePic: string;
      leadCategory: string;
      to: any;
      transferTo: any;
      transferFrom: any;
      transferAt: any;
    }> = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (calledAt) updates.calledAt = calledAt;
    if (status) updates.status = status;
    if (course) updates.course = course;
    if (remark) updates.remark = remark;
    if (reminders) updates.reminders = reminders;
    if (remarkUpdatedAt) updates.remarkUpdatedAt = remarkUpdatedAt;
    if (statusUpdatedAt) updates.statusUpdatedAt = statusUpdatedAt;
    if (date) updates.date = date;
    if (tenthPercent) updates.tenthPercent = tenthPercent;
    if (twelfthPercent) updates.twelfthPercent = twelfthPercent;
    if (ugPercent) updates.ugPercent = ugPercent;
    if (pgPercent) updates.pgPercent = pgPercent;
    if (country) updates.country = country;
    if (gender) updates.gender = gender;
    if (counsellorName) updates.counsellorName = counsellorName;
    if (address) updates.address = address;
    if (profilePic) updates.profilePic = profilePic;
    if (leadCategory) updates.leadCategory = leadCategory;
    if (to) updates.to = to;
    if (transferTo) updates.transferTo = transferTo;
    if (transferFrom) updates.transferFrom = transferFrom;
    if (transferAt) updates.transferAt = transferAt;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Check for duplicate phoneNumber
    if (phoneNumber) {
      const duplicate = await collection.findOne({
        phoneNumber,
        _id: { $ne: new ObjectId(id) }, // Exclude the current document
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Duplicate phone number detected: ${phoneNumber}` },
          { status: 400 }
        );
      }
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

    return NextResponse.json({
      message: "Student record updated successfully",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests to delete a business record by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("business-leads");

    // Extract query param for single deletion
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    // Extract body for multiple deletions
    const { ids } = await request.json().catch(() => ({}));

    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ error: "Invalid or missing ID(s)" }, { status: 400 });
    }

    let result;

    if (id) {
      // Single deletion
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
      result = await collection.deleteOne({ _id: new ObjectId(id) });
    } else {
      // Multiple deletion
      const objectIds = ids.map((item: string) => (ObjectId.isValid(item) ? new ObjectId(item) : null)).filter(Boolean);
      result = await collection.deleteMany({ _id: { $in: objectIds } });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "No matching records found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `${result.deletedCount} business record(s) deleted successfully`,
    });

  } catch (e) {
    console.error("Error deleting business records:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
