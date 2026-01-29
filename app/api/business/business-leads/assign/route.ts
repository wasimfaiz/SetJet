// app/api/update-to/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // 1) Parse and validate body
    const { to, ids, assignedAt } = await request.json();

    if (typeof to !== "string" || to.trim() === "") {
      return NextResponse.json(
        { error: "Invalid 'to'; expected non‑empty string" },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => typeof id !== "string" || !ObjectId.isValid(id))
    ) {
      return NextResponse.json(
        { error: "Invalid 'ids'; expected array of valid string IDs" },
        { status: 400 }
      );
    }

    if (assignedAt !== undefined && typeof assignedAt !== "string") {
      return NextResponse.json(
        { error: "Invalid 'assignedAt'; expected ISO string" },
        { status: 400 }
      );
    }

    // 2) Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();  // uses default from MONGODB_URI
    const collection = db.collection("business-leads");

    // 3) Convert string IDs to ObjectId
    const objectIds = ids.map((id) => new ObjectId(id));

    // 4) Build update document
    const updateDoc: Record<string, any> = { to };
    if (assignedAt) updateDoc.assignedAt = assignedAt;

    // 5) Perform bulk update
    const result = await collection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateDoc }
    );

    // 6) Respond
    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount}/${result.matchedCount} documents.`,
    });
  } catch (error) {
    console.error("❌ update-to error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
