// app/api/cron/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb"; // adjust if your lib path differs

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("blogs");

    const now = new Date();

    const result = await collection.updateMany(
      {
        publish: false,
        scheduledAt: { $lte: now },
      },
      {
        $set: { publish: true },
        $unset: { scheduledAt: "" },
      }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (e) {
    console.error("Cron publish error", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
