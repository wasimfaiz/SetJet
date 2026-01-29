import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Handle GET requests to fetch all database or a specific database by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("database");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const employeeId = url.searchParams.get("employeeId");

    // Determine if pagination is enabled by checking if both page and limit are provided.
    const hasPage = url.searchParams.has("page");
    const hasLimit = url.searchParams.has("limit");
    const paginate = hasPage && hasLimit;

    // If pagination is enabled, parse the values.
    let page = 1;
    let limit = 10;
    if (paginate) {
      page = parseInt(url.searchParams.get("page") || "1", 10);
      limit = parseInt(url.searchParams.get("limit") || "10", 10);

      // Validate page and limit if provided.
      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: "Invalid page or limit parameter" },
          { status: 400 }
        );
      }
    }

    // Fetch by document ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const student = await collection.findOne({ _id: new ObjectId(id) });
      if (!student) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }
      return NextResponse.json(student, { status: 200 });
    }

    // Build a base query (for now, we only use employeeId if provided)
    const baseQuery: any = {};
    if (employeeId) {
      baseQuery["employee.id"] = employeeId;
    }

    let totalDocuments = 0;
    let database;

    if (employeeId) {
      // Count documents matching employeeId
      totalDocuments = await collection.countDocuments(baseQuery);

      if (paginate) {
        // Fetch with pagination and sorted by latest first
        database = await collection
          .find(baseQuery)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
      } else {
        // Fetch all matching documents (no pagination)
        database = await collection.find(baseQuery).sort({ createdAt: -1 }).toArray();
      }
    } else {
      // For fetching all documents
      totalDocuments = await collection.countDocuments();

      if (paginate) {
        database = await collection
          .find({})
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
      } else {
        database = await collection.find({}).sort({ createdAt: -1 }).toArray();
      }
    }

    //Not Reverse the order after fetching if needed (you are reversing after sorting by createdAt -1)
    // database.reverse();

    const response = {
      database,
      totalCount: totalDocuments,
      currentPage: paginate ? page : 1,
      totalPages: paginate ? Math.ceil(totalDocuments / limit) : 1,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle POST requests to CREATE a new database
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("database");

    const { name, type } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const now = new Date();
    const createdAt = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    ); // Use native JS for timezone handling
    const result = await collection.insertOne({
      name,
      type,
      createdAt,
    });

    return NextResponse.json(
      {
        message: "Database saved successfully",
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

// Handle DELETE requests to delete a database record by ID
export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const databaseCollection = db.collection("database");
    const studentCollection = db.collection("student-database-backup");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    // Fetch the parent document
    const databaseDoc = await databaseCollection.findOne({ _id: new ObjectId(id) });
    if (!databaseDoc) {
      return NextResponse.json({ error: "No document found with that ID" }, { status: 404 });
    }

    // Delete the database document
    const { deletedCount: dbDeleted } = await databaseCollection.deleteOne({ _id: new ObjectId(id) });
    if (dbDeleted === 0) {
      return NextResponse.json({ error: "Failed to delete the database document" }, { status: 500 });
    }

    // Delete related student records by matching the string-typed databaseId
    const { deletedCount: studentsDeleted } = await studentCollection.deleteMany({
      databaseId: databaseDoc.databaseId
    });

    return NextResponse.json(
      {
        message: "Database and associated student records deleted successfully",
        deletedStudents: studentsDeleted,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

//PUT API
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("database");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      console.error("Invalid or missing ID");
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Original Request Body:", body);

    if (!body || Object.keys(body).length === 0) {
      console.error("No update data provided");
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    // Remove _id from the payload to avoid immutable field error
    const { _id, ...updateData } = body;
    console.log("Sanitized Update Data:", updateData);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log("Update Result:", result);

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
