import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    // Parse the JSON payload
    const body = await req.json();
    const { transferTo, transferFrom, transferAt, ids } = body;

    // Validate payload
    if (!transferTo || !transferFrom || !transferAt || !ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");

    // Convert id strings to ObjectId instances
    const objectIds = ids.map((id: string) => new ObjectId(id));

    // Update all business with the provided IDs
    const result = await db.collection("business-leads").updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
            transferTo,
            transferFrom,
            transferAt: new Date(transferAt)
        }
      }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: "business leads(s) transferred successfully"
    });
  } catch (error) {
    console.error("Error transferring business lead(s):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
