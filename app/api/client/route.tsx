import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs"; // Use bcrypt for password hashing

// Function to connect to MongoDB and get the clients collection
async function getclientsCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("clients");
}
async function getEmployeesCollection() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  return db.collection("employees");
}
// POST API - Create client
export async function POST(request: Request) {
  try {
    const clientData = await request.json();
    // const hashedPassword = await bcrypt.hash(clientData.password, 10);

    const clientsCollection = await getclientsCollection();
    const result = await clientsCollection.insertOne({
      ...clientData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "client created successfully",
      clientId: result.insertedId, // Include the client ID in the response
    });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const clientType = url.searchParams.get("clientType");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const rm = url.searchParams.get("rm");

  try {
    const clientsCollection = await getclientsCollection();

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid client ID" },
          { status: 400 }
        );
      }

      const client = await clientsCollection.findOne({ _id: new ObjectId(id) });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(client, { status: 200 });
    }

    let query: any = {};

    if (clientType) {
      query.clientType = clientType;
    }
    if (rm) {
      if (!ObjectId.isValid(rm)) {
        return NextResponse.json(
          { error: "Invalid employee ID for rm" },
          { status: 400 }
        );
      }

      const employeesCollection = await getEmployeesCollection();
      const employee = await employeesCollection.findOne({
        _id: new ObjectId(rm),
      });

      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found for given ID" },
          { status: 404 }
        );
      }

      // Use the employee's email to match clients
      query["studentInfo.rm"] = employee.basicField.email;
    }

    if (search) {
      const searchQuery = {
        $or: [
          { "studentInfo.name": { $regex: search, $options: "i" } },
          { "studentInfo.email": { $regex: search, $options: "i" } },
          { "studentInfo.contact": { $regex: search, $options: "i" } },
        ],
      };
      query = { $and: [query, searchQuery] };
    }

    // Get total document count before pagination
    const totalCount = await clientsCollection.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    if (page > totalPages && totalPages > 0) {
      return NextResponse.json(
        { error: "Page number exceeds total pages", totalPages },
        { status: 400 }
      );
    }

    const clients = await clientsCollection
      .find(query)
      .sort({ _id: -1 }) // Sort newest first
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      {
        clients,
        totalPages,
        currentPage: page,
        totalCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const updates = await request.json();

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || updates.id;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  if (!updates || Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const clientsCollection = await getclientsCollection();

    // Fetch the existing document so we can detect changes (especially for studentInfo.rm)
    const existing = await clientsCollection.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    // Prepare update payload (don't include id in $set)
    const { id: _ignored, ...toSet } = updates;

    // Perform update
    const result = await clientsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...toSet } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    // Detect if studentInfo.rm changed
    const newRm =
      updates.studentInfo && updates.studentInfo.rm !== undefined
        ? updates.studentInfo.rm
        : undefined;

    const oldRm = existing.studentInfo?.rm;

    const rmChanged = newRm !== undefined && String(newRm) !== String(oldRm);

    if (rmChanged) {
      // determine phone to use: prefer updated contact if provided, else existing
      const phone =
        (updates.studentInfo && updates.studentInfo.contact) ||
        existing.studentInfo?.contact ||
        existing.studentInfo?.phone ||
        existing.phoneNumber ||
        "";

      // format message exactly as requested
      const smsPayload = {
        phoneNumber: phone,
        serviceName: "University shortlisting",
        message:
          "You now have a Relationship Manager to guide you through university shortlisting. - YaStudy Team",
      };

      // Call internal SMS API - adjust base URL if required.
      // Using relative path should work when called from server (same origin).
      // If your deployment requires absolute URL, set NEXT_PUBLIC_BASE_URL env var.
      const smsUrl = (process.env.NEXT_PUBLIC_BASE_URL || "") + "/api/sms";

      try {
        // Use fetch so we keep everything server-side
        const smsRes = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(smsPayload),
        });

        if (!smsRes.ok) {
          const txt = await smsRes.text().catch(() => "");
          console.error(
            `SMS API returned ${smsRes.status}: ${txt || "(no body)"}`
          );
          // Note: not throwing - we don't want SMS failure to rollback the DB update
        } else {
          // optional: parse response for logging
          const smsJson = await smsRes.json().catch(() => null);
          console.log("SMS sent successfully:", smsJson);
        }
      } catch (smsErr) {
        console.error("Failed to send SMS after RM change:", smsErr);
        // Again, don't throw; DB update succeeded
      }
    }

    return NextResponse.json({
      message: "client created successfully",
      clientId: id,
    });
  } catch (error) {
    console.error("Failed to update client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete client by ID
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  try {
    const clientsCollection = await getclientsCollection();
    const result = await clientsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No client found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "client deleted successfully" });
  } catch (error) {
    console.error("Failed to delete client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
