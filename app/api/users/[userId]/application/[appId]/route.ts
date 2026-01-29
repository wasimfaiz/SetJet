import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { userId: string; appId: string } }
  ) {
    const { userId, appId } = params;
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const users = db.collection("users");
  
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      //@ts-ignore
      { $pull: { applications: { id: appId } } }
    );
  
    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }
  
    return NextResponse.json({ message: "Application deleted." }, { status: 200 });
  }
  