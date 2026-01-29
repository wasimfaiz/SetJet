// app/api/protected-route/route.ts
import { NextResponse } from "next/server";
import { verifyJWT } from "../auth/middleware";

export async function GET(req: Request) {
  // Check if the JWT token is valid
  const user = verifyJWT(req);

  // If the token is invalid or missing, return an error response
  if (user instanceof Response) {
    return user; // Return the error response from verifyJWT
  }

  // If the token is valid, allow access to the route
  return NextResponse.json({
    message: "You have access to this protected route",
    user,
  });
}
