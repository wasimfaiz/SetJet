import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/app/lib/mongodb";

async function getAdminsCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("admins");
}

// Forgot Password API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, oldPassword, newPassword } = body;

    // Validate input
    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Email, old password, and new password are required" },
        { status: 400 }
      );
    }

    const admins = await getAdminsCollection();

    // Check if admin exists
    const admin = await admins.findOne({ email });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Old password is incorrect" },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin's password
    await admins.updateOne(
      { email },
      { $set: { password: hashedNewPassword } }
    );

    // Successful password update
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during password update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
