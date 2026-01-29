import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { collectionName } = await req.json();
    if (!collectionName) {
      return NextResponse.json(
        { error: "collectionName is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection(collectionName);

    // 1) Normalize `to` → to.id + assignedAt
    const toResult = await col.updateMany(
      { to: { $type: "object" } },
      [
        {
          $set: {
            to: "$to.id",
            assignedAt: { $ifNull: ["$to.assignedAt", "$assignedAt"] },
          },
        },
      ]
    );

    // 2) Normalize `by` → by.employeeId
    const byResult = await col.updateMany(
      { by: { $type: "object" } },
      [
        {
          $set: { by: "$by.employeeId" },
        },
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Normalized collection '${collectionName}'`,
      modifiedCount: toResult.modifiedCount + byResult.modifiedCount,
      details: {
        toModified: toResult.modifiedCount,
        byModified: byResult.modifiedCount,
      },
    });
  } catch (err) {
    console.error("❌ Normalization Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
