// pages/api/summary.js
import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("mydatabase");

        const employeeCount = await db.collection("employees").countDocuments();
        const clientCount = await db.collection("clients").countDocuments();
        const contactCount = await db.collection("contacts").countDocuments();
        const visitCount = await db.collection("visits").countDocuments();
        const paymentCount = await db.collection("payments").countDocuments();
        const blogCount = await db.collection("blogs").countDocuments();
        const counsellingCount = await db.collection("counselling").countDocuments();
        const mydatabaseCount = await db.collection("database").countDocuments();
        const groundLeadCount = await db.collection("leads").countDocuments(); // Replace "ground_leads" with your actual collection name
        const studentDatabse = await db.collection("student-database-backup").countDocuments();
        // Calculate total database management count
        const databaseManagementCount = studentDatabse + groundLeadCount;

        // IMPORTANT: Replace these with your actual maximums!
        const maxEmployees = 100;
        const maxClients = 500;
        const maxEnquiry = 200;
        const maxBlogs = 50;
        const maxDatabaseManagement = 450; // Adjust maximum
        const maxMydatabase = 300;
         const enquiryCount = contactCount + visitCount + paymentCount;


        return NextResponse.json({
            employees: { value: employeeCount, maxValue: maxEmployees },
            clients: { value: clientCount, maxValue: maxClients },
            enquiry: { value:  enquiryCount, maxValue: maxEnquiry },
            blogs: { value: blogCount, maxValue: maxBlogs },
            databaseManagement: { value: databaseManagementCount, maxValue: maxDatabaseManagement },
            mydatabase: { value: mydatabaseCount, maxValue: maxMydatabase }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}