import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { employeeId, playerId } = await req.json();
    if (!employeeId || !playerId) {
      return NextResponse.json({ error: "Missing employeeId or playerId" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("mydatabase");
    // Update employee document (adjust the filter as per your schema)
    await db.collection("employees").updateOne(
      { _id: employeeId },
      { $set: { playerId } }
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error storing playerId:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
