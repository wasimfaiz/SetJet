// File: app/api/users/[userId]/application/[appId]/steps/[stepId]/route.ts

import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string; appId: string; stepId: string } }
) {
  const { userId, appId, stepId } = params;

  let body: { name?: string; status?: string; remark?: string; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
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

  // Ensure user exists
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Ensure application exists
  const appIndex = Array.isArray(user.applications)
    ? user.applications.findIndex((app: any) => app.id === appId)
    : -1;
  if (appIndex === -1) {
    return NextResponse.json(
      { message: "Application not found." },
      { status: 404 }
    );
  }

  // Perform the update using arrayFilters
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        "applications.$[app].steps.$[step].name": name,
        "applications.$[app].steps.$[step].remark": remark,
        "applications.$[app].steps.$[step].status": status,
        "applications.$[app].steps.$[step].fileUrl": fileUrl || null,
      },
    },
    {
      arrayFilters: [
        { "app.id": appId },
        { "step.id": stepId }
      ],
    }
  );

  // Return the updated step
  const updatedStep = { id: stepId, name, status, remark, fileUrl: fileUrl || null };
  return NextResponse.json(updatedStep, { status: 200 });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { userId: string; appId: string; stepId: string } }
  ) {
    const { userId, appId, stepId } = params;
  
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const users = db.collection("users");
  
    // Ensure user exists
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
  
    // Ensure application exists
    const appExists = Array.isArray(user.applications) &&
      user.applications.some((app: any) => app.id === appId);
    if (!appExists) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 }
      );
    }
  
    // Remove the step from the steps array
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      //@ts-ignore
      { $pull: { "applications.$[app].steps": { id: stepId } } },
      { arrayFilters: [{ "app.id": appId }] }
    );
  
    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Step not found or not deleted." }, { status: 404 });
    }
  
    return NextResponse.json({ message: "Step deleted successfully." }, { status: 200 });
  }