import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { sendEmail } from "@/app/lib/ses";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // support multiple payload shapes
    const { userId, to, batchId, subject, html } = body;

    if (!subject || !html) {
      return NextResponse.json(
        { error: "subject and html are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");

    
    if (userId) {
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json(
          { error: "Invalid userId" },
          { status: 400 }
        );
      }

      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      if (!user || !user.email) {
        return NextResponse.json(
          { error: "User not found or user email missing" },
          { status: 404 }
        );
      }

      await sendEmail({
        to: user.email,
        subject,
        html,
      });

      return NextResponse.json(
        { success: true, message: "Email sent successfully" },
        { status: 200 }
      );
    }

    // 2️⃣ DIRECT SINGLE EMAIL: { to, subject, html }
    if (to) {
      await sendEmail({ to, subject, html });
      return NextResponse.json(
        { success: true, message: "Email sent successfully" },
        { status: 200 }
      );
    }

    // 3️⃣ BATCH MODE: { batchId, subject, html }  -> all students assigned to that batch
    if (batchId) {
      if (!ObjectId.isValid(batchId)) {
        return NextResponse.json(
          { error: "Invalid batchId" },
          { status: 400 }
        );
      }

      const batch = await db
        .collection("batches") // change name if your collection is "batch"
        .findOne({ _id: new ObjectId(batchId) });

      if (!batch) {
        return NextResponse.json(
          { error: "Batch not found" },
          { status: 404 }
        );
      }

      // students that have this batchId in their `batches` array
      const students = await db
        .collection("students")
        .find({
          "batches.id": batchId, // you store id as string in student.batches
          email: { $exists: true, $ne: "" },
        })
        .toArray();

      if (!students.length) {
        return NextResponse.json(
          { error: "No students with email found for this batch" },
          { status: 404 }
        );
      }

      await Promise.all(
        students.map((s: any) =>
          sendEmail({
            to: s.email,
            subject,
            html,
          })
        )
      );

      return NextResponse.json(
        {
          success: true,
          message: `Email sent to ${students.length} students`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Provide either userId, to, or batchId" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Email Sender Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
