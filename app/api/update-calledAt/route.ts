import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

    // Update documents where 'remark' exists but 'remarkUpdatedAt' does NOT exist
    const result = await collection.updateMany(
      { remark: { $exists: true }, remarkUpdatedAt: { $exists: false } }, // Condition
      {
        $set: { remarkUpdatedAt: [] }, // Add empty array
      }
    );

    return NextResponse.json({
      success: true,
      message: "Added 'remarkUpdatedAt' as an empty array to applicable documents.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating remarks:", error);
    return NextResponse.json(
      { error: "Failed to update remarks" },
      { status: 500 }
    );
  }
}
