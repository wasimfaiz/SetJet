import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Function to connect to MongoDB and get the colleges collection
async function getCollegesCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("colleges");
}

// POST API - Create College
export async function POST(request: Request) {
  try {
    const collegeData = await request.json();
    const collegesCollection = await getCollegesCollection();
    const result = await collegesCollection.insertOne({
      ...collegeData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "college created successfully",
      collegeId: result.insertedId, // Include the college ID in the response
    });
  } catch (error) {
    console.error("Failed to create college:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API - Fetch College by ID or Get All Colleges with Pagination
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const country = url.searchParams.get("country");
  const search = url.searchParams.get("search");
  const courseName = url.searchParams.get("courseName");
  const streamName = url.searchParams.get("streamName");
  const state = url.searchParams.get("state");
  const city = url.searchParams.get("city");
  const ids = url.searchParams.get("ids");

  // Pagination parameters
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const collegesCollection = await getCollegesCollection();

    const filter: any = {};
    if (ids) {
      const idArray = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (idArray.length) {
        filter._id = { $in: idArray.map((s) => new ObjectId(s)) };
      }
    } else if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid college ID" },
          { status: 400 }
        );
      }
      filter._id = new ObjectId(id);
    }

    if (country) {
      const c = country.toUpperCase();
      if (c === "ALL") {
        // no filter
      } else if (c === "INDIA") {
        filter.country = "INDIA";
      } else if (c === "ABROAD") {
        filter.country = { $ne: "INDIA" };
      } else {
        filter.country = country;
      }
    }

    if (state) filter.state = state;

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { country: regex },
        { state: regex },
        { city: regex },
        { "courses.name": regex },
        { "courses.eligibility": regex },
        { "courses.stream": regex },
        { "courses.duration": regex },
        { "courses.applicationFee": regex },
        { "courses.admissionCharges": regex },
        { "courses.erpFee": regex },
        { "courses.internalExamFee": regex },
        { "courses.libraryMedicalFee": regex },
        { "courses.totalFeePerYear": regex },
        { "courses.tuitionFeePerYear": regex },
        { "courses.totalFeeFullCourse": regex },
        { "courses.subcourses.name": regex },
        { "courses.subcourses.eligibility": regex },
      ];
    }

    if (courseName) {
      filter.courses = { $elemMatch: { name: new RegExp(courseName, "i") } };
    }

    let totalCount = await collegesCollection.countDocuments(filter);

    // apply sort by _id descending so the latest inserted come first
    let cursor = collegesCollection.find(filter).sort({ _id: -1 });

    // apply pagination
    const colleges = await cursor.skip(skip).limit(limit).toArray();

    // post-filter by city (in-memory) if provided
    const filteredByCity = city
      ? colleges.filter((c) => c.city === city)
      : colleges;

    // further post-filter by streamName, if provided
    const finalList = streamName
      ? filteredByCity.filter((college) =>
          college.courses?.some((course: any) =>
            course.subcourses?.some((sub: any) => {
              const decoded = decodeURIComponent(streamName).trim().normalize();
              const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(escaped, "i");
              const n = sub.name.trim().normalize();
              return n === decoded || regex.test(n) || n.includes(decoded);
            })
          )
        )
      : filteredByCity;

    return NextResponse.json(
      {
        colleges: finalList,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching college:", err);
    return NextResponse.json(
      { error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}

// PUT API - Update College by ID
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

    const collegesCollection = await getCollegesCollection();
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "college updated successfully" });
  } catch (error) {
    console.error("Failed to update college:", error);
    return NextResponse.json(
      { error: "Failed to update college" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete College by ID
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
    const collegesCollection = await getCollegesCollection();
    const result = await collegesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No college found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "College deleted successfully" });
  } catch (error) {
    console.error("Failed to delete college:", error);
    return NextResponse.json(
      { error: "Failed to delete college" },
      { status: 500 }
    );
  }
}
