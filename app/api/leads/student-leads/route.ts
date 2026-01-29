import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb"; 
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-leads");

    const {
      name,
      email,
      phoneNumber,
      status,
      course,
      remark,
      date,
      tenthPercent,
      twelfthPercent,
      ugPercent,
      pgPercent,
      country,
      gender,
      counsellorName,
      address,
      by,
      to,
      assignedAt,
      leadCategory,
      profilePic,
    } = await request.json();

    // Check if phoneNumber already exists
    const existingStudent = await collection.findOne({ phoneNumber });
    if (existingStudent) {
      return NextResponse.json(
        {
          error: `Duplicate phone number detected: ${phoneNumber}`,
        },
        { status: 400 }
      );
    }
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const createdAt = new Date(now.getTime() + istOffset);
    // Prepare the document to insert
    const newStudent = {
      name,
      email,
      phoneNumber,
      leadCategory,
      date: date || null,
      tenthPercent: tenthPercent || null,
      twelfthPercent: twelfthPercent || null,
      ugPercent: ugPercent || null,
      pgPercent: pgPercent || null,
      course: course || null,
      status: status || null,
      country: country || null,
      gender: gender || null,
      counsellorName: counsellorName || null,
      address: address || null,
      remark: remark || null,
      profilePic: profilePic || null,
      createdAt: createdAt,
      updatedAt: createdAt,
      by: by,
      to: to,
      assignedAt: assignedAt
    };

    // Insert the new document
    const result = await collection.insertOne(newStudent);

    return NextResponse.json({
      message: "Student record created successfully",
      id: result.insertedId,
    });
  } catch (error: any) {
    console.error(error);

    // Handle unique index error
    if (error.code === 11000 && error.keyPattern.phoneNumber) {
      return NextResponse.json(
        {
          error: `Duplicate phone number detected: ${error.keyValue.phoneNumber}`,
        },
        { status: 400 }
      );
    }

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
    const collection = db.collection("student-leads");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") || "ALL";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const searchTerm = url.searchParams.get("searchTerm");
    const employeeId = url.searchParams.get("employeeId");
    const assignId = url.searchParams.get("assignId");
    const category = url.searchParams.get("category");
    const date = url.searchParams.get("date");
    const calledAtDate = url.searchParams.get("calledAtDate");
    const itemsPerPage = parseInt(url.searchParams.get("limit") || "10", 10);
    const assigned = url.searchParams.get("assigned");
    const sort = url.searchParams.get("sort"); // e.g. "ascending" or "descending"
    const transferId = url.searchParams.get("transferId");
    const course = url.searchParams.get("course");
    const updated = url.searchParams.get("updated") || "ALL"

    // If an ID is provided, return that document only.
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
      const student = await collection.findOne({ _id: new ObjectId(id) });
      if (!student) {
        return NextResponse.json({ error: "No student found with that ID" }, { status: 404 });
      }
      return NextResponse.json(student);
    }

    // Build the main query.
    const query: any = {};

    if (status === "TOTAL CALLS") {
      query.calledAt = { $exists: true };
    } else if (status !== "ALL") {
      if (status === "TRANSFER") {
        query.transferAt = { $exists: true };
      } else {
        query.status = status;
      }
    }

    if (employeeId) {
      query.by = employeeId;
    }
    if (transferId) {
      query.transferTo = transferId;
    }
    if (assignId) {
      query.to = assignId;
    }
    if (category) {
      query.leadCategory = category;
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
    if (assigned) {
      query.to = assigned === "ASSIGNED" ? { $exists: true } : { $exists: false };
    }
    if (updated === "UPDATED") {
      // status exists and is not null
      query.status = { $exists: true, $ne: null };
    }

    if (updated === "NOT UPDATED") {
      // status either doesn’t exist, or exists but is null
      query.$or = [
        { status: { $exists: false } },
        { status: null }
      ];
    }

    // Build sorting query.
    const sortQuery: any = {};
    if (sort) {
      sortQuery["assignedAt"] = -1;
    } else {
      sortQuery.createdAt = -1;
    }
    // Always add secondary sort on _id descending for stability.
    sortQuery._id = -1;

    // Get total count based on the main query.
    const totalCount = await collection.countDocuments(query);

    // Apply sorting and pagination.
    let students;
    if (url.searchParams.has("page") && url.searchParams.has("limit")) {
      const skip = (page - 1) * itemsPerPage;
      students = await collection.find(query).sort(sortQuery).skip(skip).limit(itemsPerPage).toArray();
    } else {
      students = await collection.find(query).sort(sortQuery).toArray();
    }

    // In-memory sorting: sort by full datetime of createdAt (latest to oldest)
    students.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

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
        students,
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
    const collection = db.collection("student-leads");

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
      assignedAt
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
      assignedAt: any;
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
    if (assignedAt) updates.assignedAt = assignedAt;

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

// Handle DELETE requests to delete a student record by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-leads");

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
      message: `${result.deletedCount} student record(s) deleted successfully`,
    });

  } catch (e) {
    console.error("Error deleting student records:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
