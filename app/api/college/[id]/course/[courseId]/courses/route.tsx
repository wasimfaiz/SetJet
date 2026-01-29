import { NextResponse } from "next/server";
import clientPromise from "../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid"; // Import UUID for generating unique IDs

// Function to connect to MongoDB and get the colleges collection
async function getCollegesCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase"); // Replace "mydatabase" with your database name
  return db.collection("colleges");
}

// POST API - Add a Sub-Course Inside a Specific Course
export async function POST(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id, courseId } = params; // College ID and Course ID
    const subCourseData = await request.json(); // Accept any fields for sub-course

    console.log(id, courseId);

    // Validate College ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing College ID" },
        { status: 400 }
      );
    }

    // Generate a unique ID for the sub-course
    const subCourseId = uuidv4();

    // Connect to MongoDB
    const collegesCollection = await getCollegesCollection();

    // Add the sub-course inside the specific course using $push and dynamic query
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id), "courses.courseId": courseId },
      {
        //@ts-ignore
        $push: {
          "courses.$.subcourses": { subCourseId, ...subCourseData },
        },
      }
    );

    // Check if the college or course was found
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "College or course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Sub-course added successfully",
      subCourse: { subCourseId, ...subCourseData },
    });
  } catch (error) {
    console.error("Error adding sub-course:", error);
    return NextResponse.json(
      { error: "Failed to add sub-course" },
      { status: 500 }
    );
  }
}

// DELETE API - Remove a Sub-Course
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id, courseId } = params; // College ID and Course ID
    const { subCourseId } = await request.json(); // Sub-course ID

    // Input validation
    if (!id || !ObjectId.isValid(id) || !courseId || !subCourseId) {
      return NextResponse.json(
        { error: "Invalid or missing IDs" },
        { status: 400 }
      );
    }

    const collegesCollection = await getCollegesCollection();

    // Remove the sub-course with the specified subCourseId
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id), "courses.courseId": courseId },
      {
        //@ts-ignore
        $pull: { "courses.$.subcourses": { subCourseId: subCourseId } },
      }
    );

    console.log("Matched Count:", result.matchedCount); // Debugging log
    console.log("Modified Count:", result.modifiedCount); // Debugging log

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "College or course not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Sub-course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Sub-course deleted successfully" });
  } catch (error) {
    console.error("Error deleting sub-course:", error);
    return NextResponse.json(
      { error: "Failed to delete sub-course" },
      { status: 500 }
    );
  }
}

// GET API
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id, courseId } = params; // College ID and Course ID
    const { searchParams } = new URL(request.url);
    const subCourseId = searchParams.get("subCourseId"); // Retrieve subCourseId from query params

    // Validate inputs
    if (!id || !ObjectId.isValid(id) || !courseId || !subCourseId) {
      return NextResponse.json(
        { error: "Invalid or missing IDs" },
        { status: 400 }
      );
    }

    const collegesCollection = await getCollegesCollection();

    // Find the college and fetch the specific course
    const college = await collegesCollection.findOne(
      { _id: new ObjectId(id), "courses.courseId": courseId },
      { projection: { "courses.$": 1 } } // Fetch only the matched course
    );

    if (!college || !college.courses || college.courses.length === 0) {
      return NextResponse.json(
        { error: "College or course not found" },
        { status: 404 }
      );
    }

    // Find the specific sub-course within the course
    const course = college.courses[0];
    const subCourse = course.subcourses.find(
      (sc: any) => sc.subCourseId === subCourseId
    );

    if (!subCourse) {
      return NextResponse.json(
        { error: "Sub-course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subCourse });
  } catch (error) {
    console.error("Error retrieving sub-course:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sub-course" },
      { status: 500 }
    );
  }
}

// PUT API - Update a Sub-Course Inside a Specific Course
export async function PUT(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id, courseId } = params; // College ID and Course ID
    const { subCourseId, ...updateData } = await request.json(); // Accept dynamic fields for update

    // Validate inputs
    if (!id || !ObjectId.isValid(id) || !courseId || !subCourseId) {
      return NextResponse.json(
        { error: "Invalid or missing inputs" },
        { status: 400 }
      );
    }

    const collegesCollection = await getCollegesCollection();

    // Update the specific sub-course with dynamic fields
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id), "courses.courseId": courseId, "courses.subcourses.subCourseId": subCourseId },
      {
        $set: {
          "courses.$[courseFilter].subcourses.$[subCourseFilter]": {
            subCourseId,
            ...updateData, // Allow all fields from the request
          },
        },
      },
      {
        arrayFilters: [
          { "courseFilter.courseId": courseId },
          { "subCourseFilter.subCourseId": subCourseId },
        ],
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "College, course, or sub-course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Sub-course updated successfully" });
  } catch (error) {
    console.error("Error updating sub-course:", error);
    return NextResponse.json(
      { error: "Failed to update sub-course" },
      { status: 500 }
    );
  }
}

