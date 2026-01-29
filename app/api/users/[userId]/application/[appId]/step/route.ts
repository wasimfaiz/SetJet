// File: app/api/users/[userId]/application/[appId]/steps/route.ts

import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { userId: string; appId: string };
  }
) {
  const { userId, appId } = params;

  let body: { name?: string; remark?: string; status?: string; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { name, status, remark, fileUrl } = body;

  if (!name || !status) {
    return NextResponse.json(
      { message: "Step `name` and `status` are required." },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");

  // Lookup the user document
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Ensure the application exists
  const applicationIndex = Array.isArray(user.applications)
    ? user.applications.findIndex((app: any) => app.id === appId)
    : -1;
  if (applicationIndex === -1) {
    return NextResponse.json(
      { message: "Application not found." },
      { status: 404 }
    );
  }

  // Build the new step
  const newStep = {
    id: Date.now().toString(),
    name,
    status,
    remark,
    fileUrl: fileUrl || null,
  };

  // Push the new step into the correct application's steps array
  await users.updateOne(
    { _id: new ObjectId(userId), "applications.id": appId },
    //@ts-ignore
    { $push: { "applications.$.steps": newStep } }
  );

  return NextResponse.json(newStep, { status: 201 });
}
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
  