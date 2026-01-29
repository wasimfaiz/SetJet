// pages/api/summary.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");

    // Fetch counts of documents in the respective collections
    const employeeCount = await db.collection("employees").countDocuments();
    const clientCount = await db.collection("clients").countDocuments();
    const contactCount = await db.collection("contacts").countDocuments();
    const visitCount = await db.collection("visits").countDocuments();
    const paymentCount = await db.collection("payments").countDocuments();

    // Calculate the total sum of enquiries (sum of contacts, visits, and payments)
    const enquiryCount = contactCount + visitCount + paymentCount;

    // Return the results
    return NextResponse.json({
      employees: employeeCount,
      clients: clientCount,
      enquiry: enquiryCount,

      
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
