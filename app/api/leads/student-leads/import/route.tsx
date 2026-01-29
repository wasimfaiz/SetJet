import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";

const REQUIRED_HEADERS = [
  "name",
  "email",
  "phoneNumber",
  "address",
  "counsellorName",
  "country",
  "date",
  "gender",
  "pgPercent",
  "profilePic",
  "tenthPercent",
  "twelfthPercent",
  "ugPercent",
];


async function ensureUniqueIndex() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const collection = db.collection("student-leads");
  await collection.createIndex({ phoneNumber: 1 }, { unique: true });
}


export async function POST(request: Request) {
  try {
    await ensureUniqueIndex();
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-leads");

    const students = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of student records." },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    let skippedDuplicates = 0;
    let duplicateEntries: { phoneNumber: string; name: string }[] = [];
    const batchSize = 500;

    // **1. Fetch all existing phone numbers in one query**
    const existingNumbersSet = new Set(
      (await collection.find({}, { projection: { phoneNumber: 1 } }).toArray()).map(
        (doc) => doc.phoneNumber
      )
    );

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const validBatch = [];
      const duplicateBatch = new Set(); // To track duplicates within the same batch

      // **2. Check duplicates in memory before inserting**
      for (const student of batch) {
        if (!student.phoneNumber) continue; // Skip invalid data

        if (existingNumbersSet.has(student.phoneNumber) || duplicateBatch.has(student.phoneNumber)) {
          duplicateEntries.push({ phoneNumber: student.phoneNumber, name: student.name || "Unknown" });
          skippedDuplicates++;
        } else {
          validBatch.push(student);
          duplicateBatch.add(student.phoneNumber); // Track this batch to prevent intra-batch duplicates
        }
      }

      if (validBatch.length > 0) {
        try {
          const result = await collection.insertMany(validBatch, { ordered: false });
          insertedCount += result.insertedCount;

          // **3. Update the existing numbers set**
          validBatch.forEach((student) => existingNumbersSet.add(student.phoneNumber));
        } catch (error: any) {
          console.error("Insertion error:", error);
        }
      }

      const progress = Math.round(((insertedCount + skippedDuplicates) / students.length) * 100);
    }

    console.log("🚨 Duplicate Entries:", duplicateEntries);

    return NextResponse.json({
      message: "Data import completed",
      insertedCount,
      skippedDuplicates,
      duplicateEntries, // Return duplicate records with phoneNumber & name
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



