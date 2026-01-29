// app/api/auth/middleware.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  
export function verifyJWT(req: Request) {
  const authHeader = req.headers.get("authorization");
 
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authorization header is missing" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1]; // Expecting 'Bearer <token>'
  if (!token) {
    return NextResponse.json(
      { message: "Authorization token is missing" },
      { status: 401 }
    );
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // Return decoded user data
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 403 }
    );
  }
}
