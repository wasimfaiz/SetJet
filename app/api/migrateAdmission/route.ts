// app/api/migrateAdmission/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

/**
 * Map an admission document to your client schema.
 * Extend this function to include more fields mapping as necessary.
 */
function mapAdmissionToClient(
  adm: any,
  actor?: { employeeId?: string; employeeName?: string }
) {
  const now = new Date().toISOString();

  const client: any = {
    clientType: "ABROAD",
    createdAt: now,
    studentInfo: {
      name: adm.name || "",
      contact: adm.phoneNumber || "",
      parentContact: "", // unknown from admission
      regNo: "", // optional, generate if needed
      regDate: now.slice(0, 10),
      dob: "", // unknown
      regOffice: "",
      gender: "",
      degree: adm.degree || "", // if present
      countryApplyingFor: adm.country || "",
      courseApplyingFor: adm.courseName || adm.streamName || "",
      rm: "",
      email: adm.email || "",
      passportSizePhoto: "",
      studentAgreement: "",
    },
    personalInfo: {
      country: adm.country || "",
      state: adm.state || "",
      district: adm.district || "",
      address: adm.address || "",
      adhaar: adm.adhaar || "",
      pan: adm.pan || "",
      adhaarFile: adm.adhaarFile || "",
      panFile: adm.panFile || "",
    },
    tenthInfo: {},
    twelfthInfo: {},
    invoiceInfo: {
      invoice: [],
      europassPackage: "",
      registration: "",
      paidAmt: "",
      firstInstallment: "",
      secondInstallment: "",
      thirdInstallment: "",
    },
    remarks: adm.remark || [],
    admissionRefId: adm._id ? String(adm._id) : undefined,
    source: "ADMISSION",
    createdBy: actor || {},
    meta: {
      migratedAt: now,
      originalAdmission: {
        _id: adm._id ? String(adm._id) : undefined,
        createdAt: adm.createdAt || undefined,
      },
    },
  };

  // include message inside studentInfo as note
  if (adm.message) client.studentInfo.studentNote = adm.message;

  return client;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    // Accept id from query param or body
    const qid = url.searchParams.get("id");
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const id = qid || body?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id (query param or body.id)" },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase"); // adjust DB name if different
    const admissionsColl = db.collection("admissions");
    const clientsColl = db.collection("clients");

    // Fetch admission
    const admission = await admissionsColl.findOne({ _id: new ObjectId(id) });
    if (!admission) {
      return NextResponse.json(
        { error: "Admission not found" },
        { status: 404 }
      );
    }

    // Prepare client payload
    const clientPayload = mapAdmissionToClient(admission);

    // Attempt a transaction if server supports it (replica set). If not, fallback to non-transactional flow.
    const session = client.startSession ? client.startSession() : null;
    let createdClient: any = null;
    try {
      if (session) {
        let transactionResults: any;
        await session.withTransaction(async () => {
          const insertRes = await clientsColl.insertOne(clientPayload, {
            session,
          });
          if (!insertRes.insertedId) {
            throw new Error("Failed to insert client within transaction");
          }
          // optional: include created client's id in response
          createdClient = {
            ...clientPayload,
            _id: insertRes.insertedId.toString(),
          };
          const delRes = await admissionsColl.deleteOne(
            { _id: new ObjectId(id) },
            { session }
          );
          if (delRes.deletedCount === 0) {
            throw new Error("Failed to delete admission within transaction");
          }
        });
        transactionResults = true;
        // if transaction succeeded, createdClient already set
      } else {
        // Fallback: Insert then delete without transaction
        const insertRes = await clientsColl.insertOne(clientPayload);
        if (!insertRes.insertedId) {
          throw new Error("Failed to insert client");
        }
        createdClient = {
          ...clientPayload,
          _id: insertRes.insertedId.toString(),
        };
        const delRes = await admissionsColl.deleteOne({
          _id: new ObjectId(id),
        });
        if (delRes.deletedCount === 0) {
          // rollback attempt: delete created client to avoid duplicates
          await clientsColl.deleteOne({ _id: insertRes.insertedId });
          throw new Error(
            "Failed to delete admission after client creation; rolled back client creation"
          );
        }
      }
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch (e) {
          // ignore
        }
      }
    }

    return NextResponse.json(
      { success: true, client: createdClient },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("migrateAdmission error:", e);
    return NextResponse.json(
      { error: e?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
