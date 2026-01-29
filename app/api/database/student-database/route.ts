import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Handle GET requests to fetch all students or a specific student by ID
export async function GET(request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db("mydatabase");
        const collection = db.collection("student-database-backup");

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const databaseId = url.searchParams.get("databaseId");
        const status = url.searchParams.get("status");
        const searchTerm = url.searchParams.get("searchTerm");
        const transferId = url.searchParams.get("transferId");
        const itemsPerPageDefault = 10;
        const sortParam = url.searchParams.get("sort");
        const assignId = url.searchParams.get("assignId");
        const course = url.searchParams.get("course");
        const updated = url.searchParams.get("updated");
        const assigned = url.searchParams.get("assigned");
        const date = url.searchParams.get("date"); //  date
        const calledAtDate = url.searchParams.get("calledAtDate");
        // If 'id' is provided, fetch a single student by ID
        if (id) {
            if (!ObjectId.isValid(id)) {
                return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
            }

            const student = await collection.findOne({ _id: new ObjectId(id) });
            if (!student) {
                return NextResponse.json({ error: "No student found with that ID" }, { status: 404 });
            }
            return NextResponse.json(student, { status: 200 });
        }

        // Build the query
        const query: any = {};

        if (databaseId) query.databaseId = databaseId;

        if (status && status !== "ALL") {
            if (status === "TOTAL CALLS") {
                query.calledAt = { $exists: true };
            } else if (status === "TRANSFER") {
                query.transferAt = { $exists: true };
            } else {
                query.status = status;
            }
        }

        if (transferId) {
            query.transferTo = transferId;
        }

        if (course && course !== "ALL") {
            query.course = course;
        }

        if (updated === "UPDATED") {
            query.status = { $exists: true, $ne: null };
        } else if (updated === "NOT UPDATED") {
            query.$or = [
                { status: { $exists: false } },
                { status: null }
            ];
        }
         if (date) {
            // Date Filter Implementation (for statusUpdatedAt)
            const startOfDay = new Date(date as string);
            startOfDay.setHours(0, 0, 0, 0);  // Set to the beginning of the day
            const endOfDay = new Date(date as string);
            endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day
      
            query.statusUpdatedAt = {
              $gte: startOfDay.toISOString(),
              $lte: endOfDay.toISOString(),
            };
          }
       if (calledAtDate) {
            const startOfDay = new Date(calledAtDate as string);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(calledAtDate as string);
            endOfDay.setHours(23, 59, 59, 999);

            query.calledAt = {
                $elemMatch: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            };
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
                            options: "i"
                        }
                    }
                }
            ];
        }

        //  Handle the 'assigned' parameter
        if (assigned === "ASSIGNED") {
            query.to = { $exists: true }; // Only students with employee.id
        } else if (assigned === "UNASSIGNED") {
            query.to = { $exists: false }; // Only students WITHOUT employee.id (null or missing)
        }
        if (assignId) {          
          query.to = assignId;
        }
        const sortQuery: any = {};
        if (sortParam?.toLowerCase() === "descending") {
            sortQuery._id = -1;
        } else if (sortParam?.toLowerCase() === "ascending") {
            sortQuery._id = 1;
        }

        const hasPagination = url.searchParams.has("page") && url.searchParams.has("limit");

        let students;
        let totalCount;
        let currentPage = 1;
        let totalPages = 1;

        if (hasPagination) {
            const page = parseInt(url.searchParams.get("page") || "1", 10);
            const limit = parseInt(url.searchParams.get("limit") || `${itemsPerPageDefault}`, 10);

            if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
                return NextResponse.json({ error: "Invalid page or limit parameter" }, { status: 400 });
            }

            const skip = (page - 1) * limit;
            students = await collection.find(query).sort(sortQuery).skip(skip).limit(limit).toArray();
            totalCount = await collection.countDocuments(query);
            currentPage = page;
            totalPages = Math.ceil(totalCount / limit);
        } else {
            students = await collection.find(query).sort(sortQuery).toArray();
            totalCount = students.length;
        }

        if (students.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        // Aggregation (ignore status filters)
        const queryForAggregation = { ...query };
        delete queryForAggregation.status;
        delete queryForAggregation.calledAt;
        delete queryForAggregation.transferAt;

        const statusAggregation = await collection.aggregate([
            { $match: queryForAggregation },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const totalCallsCount = await collection.countDocuments({
            ...queryForAggregation,
            calledAt: { $exists: true }
        });

        const statusTotals: { [key: string]: number } = {};
        statusAggregation.forEach((item: any) => {
            statusTotals[item._id] = item.count;
        });
        statusTotals["TOTAL CALLS"] = totalCallsCount;

        return NextResponse.json({
            students,
            totalCount,
            totalStatusCount: statusTotals,
            page: currentPage,
            totalPages
        }, { status: 200 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Handle PUT requests to UPDATE an existing student record
export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

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
      state,
      calledAt,
      course,
      remark,
      transferTo,
      transferFrom,
      transferAt
    } = await request.json();

    // Create updates object
    const updates: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      state: string;
      calledAt: any;
      status: string;
      course: string;
      remark: any;
      statusUpdatedAt: string;
      transferTo: any;
      transferFrom: any;
      transferAt: any;
    }> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (state) updates.state = state;
    if (calledAt) updates.calledAt = calledAt;
    if (status) updates.status = status;
    if (course) updates.course = course;
    if (remark) updates.remark = remark;
    if (statusUpdatedAt) updates.statusUpdatedAt = statusUpdatedAt;
    if (transferTo) updates.transferTo = transferTo;
    if (transferFrom) updates.transferFrom = transferFrom;
    if (transferAt) updates.transferAt = transferAt;

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
    const collection = db.collection("student-database-backup");

    // Extract the student ID from the request URL
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

    return NextResponse.json({
      message: "Student record deleted successfully",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

    // Parse incoming JSON payload
    const { databaseIds, status, searchTerm, page = 1, limit = 10 } = await request.json();

    // Check for required fields in payload
    if (!databaseIds || !status) {
      return NextResponse.json(
        { error: "Missing required parameters: databaseIds or status" },
        { status: 400 }
      );
    }

    // Build query based on incoming data
    const query: any = { databaseId: { $in: databaseIds } };

    // Optionally filter by status if provided
    if (status && status !== "ALL") {
      query.status = status;
    }

    // If searchTerm is provided, search across name, phoneNumber, and email
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search for name
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" }, // Convert phoneNumber to a string
              regex: searchTerm,
              options: "i", // Case-insensitive
            },
          },
        },
      ];
    }  

    // Log the query for debugging purposes
    console.log("Database query:", query);

    // Fetch all matching students from the database
    const allStudents = await collection.find(query).toArray();

    // Reverse the entire array of students
    const reversedStudents = allStudents.reverse();

    // Calculate the skip value based on the current page and limit
    const skip = (page - 1) * limit;
    const paginatedStudents = reversedStudents.slice(skip, skip + limit);

    // Reverse the individual page items
    const finalStudents = paginatedStudents.reverse();

    // Get the total count of students matching the query (without pagination)
    const totalCount = allStudents.length;

    // Log the number of students found
    console.log("Students found:", finalStudents.length);

    // Return the response with the students and pagination details
    return NextResponse.json({
      students: finalStudents,
      totalCount,
      totalPages: Math.ceil(totalCount / limit), // Calculate total number of pages
      currentPage: page, // Include the current page
    });

  } catch (e) {
    console.error("Error in POST /api/database/student-database:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}