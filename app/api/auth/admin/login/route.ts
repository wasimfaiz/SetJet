// api/auth/admin/login
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "@/app/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getAdminsCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("admins");
}

// Get admin by email
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admins = await getAdminsCollection();

    // Find the admin by email
    const admin = await admins.findOne(
      { email },
      { projection: { password: 0 } } // Exclude the password field
    );
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Generate JWT token for the admin
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return NextResponse.json({ admin, token }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Login admin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const admins = await getAdminsCollection();

    // Check if admin exists
    const admin = await admins.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Successful login
    return NextResponse.json(
      { message: "Login successful", email: admin.email, token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
