import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";
import { v4 as uuidv4 } from "uuid"; // To generate unique IDs for courses

async function getCollegesCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("colleges");
}
// GET API - Retrieve a Course by College ID and Course ID
export async function GET(request: any, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // College ID
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId"); // Retrieve courseId from query params

    // Validate inputs
    if (!id || !ObjectId.isValid(id) || !courseId) {
      return NextResponse.json(
        { error: "Invalid or missing college/course ID" },
        { status: 400 }
      );
    }

    const collegesCollection = await getCollegesCollection();

    // Find the college by ID
    const college = await collegesCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { courses: 1 } } // Only fetch the courses field
    );

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    // Find the course by courseId within the courses array
    const course = college.courses.find((c: any) => c.courseId === courseId);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found in the specified college" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Failed to retrieve course:", error);
    return NextResponse.json(
      { error: "Failed to retrieve course" },
      { status: 500 }
    );
  }
}

// POST API - Add a Course to a College
export async function POST(request: any, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // College ID
    const courseData = await request.json(); // Accept any data sent in the body

    // Validate College ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing college ID" }, { status: 400 });
    }

    const collegesCollection = await getCollegesCollection();

    // Generate unique ID for the course
    const newCourse = {
      courseId: uuidv4(), // Unique course ID
      ...courseData, // Include all fields from the request body
    };

    // Add the new course to the college's courses array
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id) },
      //@ts-ignore
      { $push: { courses: newCourse } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "No college found with the specified ID" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Course added successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error("Failed to add course:", error);
    return NextResponse.json({ error: "Failed to add course" }, { status: 500 });
  }
}


// PUT API - Update a Course in a College
//@ts-ignore
export async function PUT(request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // College ID
    const { courseId, ...updateData } = await request.json(); // Allow any fields for update

    // Validate inputs
    if (!id || !ObjectId.isValid(id) || !courseId) {
      return NextResponse.json({ error: "Invalid or missing college/course ID" }, { status: 400 });
    }

    const collegesCollection = await getCollegesCollection();

    // Update the specific course in the courses array
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id), "courses.courseId": courseId },
      {
        $set: Object.entries(updateData).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [`courses.$.${key}`]: value, // Dynamically set fields
          }),
          {}
        ),
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course updated successfully" });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE API - Remove a Course from a College
//@ts-ignore
export async function DELETE(request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // College ID
    const { courseId } = await request.json();

    // Validate inputs
    if (!id || !ObjectId.isValid(id) || !courseId) {
      return NextResponse.json(
        { error: "Invalid or missing college/course ID" },
        { status: 400 }
      );
    }

    const collegesCollection = await getCollegesCollection();

    // Remove the course with the specified courseId from the courses array
    const result = await collegesCollection.updateOne(
      { _id: new ObjectId(id) },
      //@ts-ignore
      { $pull: { courses: { courseId: courseId } } } // Match courseId correctly
    );

    console.log("Matched Count:", result.matchedCount); // Log matched documents
    console.log("Modified Count:", result.modifiedCount); // Log modified documents

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Course not found in the college" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

