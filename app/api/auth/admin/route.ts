import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get the database and admins collection
    const client = await clientPromise;
    const db = client.db("mydatabase"); // Replace 'mydatabase' with your actual database name
    const admins = db.collection("admins");

    // Check if admin already exists
    const existingAdmin = await admins.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store admin in the database
    await admins.insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
      permissions: "all",
    });

    return NextResponse.json(
      { message: "Admin created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
