import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Function to connect to MongoDB and get the facultys collection
async function getFacultysCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("facultys");
}

// POST API - Create Faculty
export async function POST(request: Request) {
  try {
    const facultyData = await request.json();
    // const hashedPassword = await bcrypt.hash(facultyData.password, 10);

    const facultysCollection = await getFacultysCollection();
    const result = await facultysCollection.insertOne({
      ...facultyData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "faculty created successfully",
      facultyId: result.insertedId, // Include the faculty ID in the response
    });
  } catch (error) {
    console.error("Failed to create faculty:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET API - Fetch Faculty by ID or Get All Facultys
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
    const facultysCollection = await getFacultysCollection();

    // If an id is provided, return the single faculty
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid faculty ID" },
          { status: 400 }
        );
      }
      const faculty = await facultysCollection.findOne({ _id: new ObjectId(id) });
      if (!faculty) {
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(faculty, { status: 200 });
    }

    // If an email is provided, return the single faculty
    if (email) {
      const faculty = await facultysCollection.findOne({ "basicField.email": email });
      if (!faculty) {
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(faculty, { status: 200 });
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
      const totalFacultys = await facultysCollection.countDocuments(query);
      const totalPages = Math.ceil(totalFacultys / limit);

      const facultys = await facultysCollection
        .find(query)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      if (!facultys || facultys.length === 0) {
        return NextResponse.json({ error: "No facultys found" }, { status: 404 });
      }

      return NextResponse.json(
        { facultys, totalFacultys, totalPages, page, limit },
        { status: 200 }
      );
    } else {
      // If no pagination parameters, return the facultys array directly
      const facultys = await facultysCollection.find(query).sort({ _id: -1 }).toArray();

      if (!facultys || facultys.length === 0) {
        return NextResponse.json({ error: "No facultys found" }, { status: 404 });
      }

      return NextResponse.json(facultys, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}



// PUT API - Update Faculty by ID
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

    const facultysCollection = await getFacultysCollection();
    const result = await facultysCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "faculty updated successfully" });
  } catch (error) {
    console.error("Failed to update faculty:", error);
    return NextResponse.json(
      { error: "Failed to update faculty" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete Faculty by ID
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
    const facultysCollection = await getFacultysCollection();
    const result = await facultysCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No faculty found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("Failed to delete faculty:", error);
    return NextResponse.json(
      { error: "Failed to delete faculty" },
      { status: 500 }
    );
  }
}
