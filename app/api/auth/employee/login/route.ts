// api/auth/employee/login
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/app/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Function to get employee by email
async function getEmployeeByEmail(email: string) {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("employees").findOne({ "basicField.email": email });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Retrieve employee by email
    const employee = await getEmployeeByEmail(email);

    // Validate employee existence, status, and password
    if (!employee) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (employee.basicField.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is inactive. Please contact support." },
        { status: 403 } // 403 Forbidden
      );
    }

    if (employee.basicField.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, email: employee.basicField.email },
      JWT_SECRET,
      { expiresIn: "7d" } //Token expire in 7days
    );

    // Return the token to the client
    return NextResponse.json(
      { token, employeeEmail: employee.basicField.email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the login request." },
      { status: 500 }
    );
  }
}
