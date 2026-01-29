import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/app/lib/ses";
import { welcomeEmail } from "@/app/email/welcomeEmail";

import axios from "axios";
import { emailUpdatedTemplate } from "@/app/email/emailUpdatedTemplate";

// ← Import your welcome email HTML template
// Handle GET requests to fetch all user or a specific user by ID
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("users");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }

      const user = await collection.findOne({ _id: new ObjectId(id) });

      if (!user) {
        return NextResponse.json(
          { error: "No document found with that ID" },
          { status: 404 }
        );
      }

      return NextResponse.json(user, { status: 200 });
    }

    const query: any = {};

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const totalCount = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const users = await collection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      { users, totalCount, totalPages, currentPage: page },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

const ADMIN_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://admin.yastudy.com";
    

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("users");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    // Fetch old user BEFORE update
    const oldUser = await collection.findOne({ _id: new ObjectId(id) });

    if (!oldUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { _id, ...updateData } = body;

    // Update user in DB
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // ---------------------------------------------
    // 📧 SEND EMAIL IF EMAIL WAS UPDATED
    // ---------------------------------------------
    const emailChanged =
      updateData.email &&
      updateData.email !== oldUser.email;

    if (emailChanged) {
      console.log("📧 Email changed! Sending welcome email...");

      // Build welcome email
      const htmlTemplate = emailUpdatedTemplate(
  oldUser.name || "User",
  updateData.email
);

      try {
        await axios.post(`${ADMIN_BASE_URL}/api/email`, {
          userId: id,
          subject: "Welcome to YaStudy – Your Email Has Been Updated!",
          html: htmlTemplate,
        });

        console.log("✔ Welcome Email Sent Successfully!");
      } catch (emailErr: any) {
        console.error("❌ Failed to send email:", emailErr.message);
      }
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );

  } catch (e) {
    console.error("PUT Error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}



// Handle DELETE requests to delete a user record by ID
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const collection = db.collection("users");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  try {
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No user found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

