// app/api/business/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from "../../lib/mongodb";

const COLLECTION_NAME = 'businesses';

// GET all businesses or a single business by ID
export async function GET(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection(COLLECTION_NAME);

  const id                 = req.nextUrl.searchParams.get("id");
  const q                  = req.nextUrl.searchParams.get("q")?.trim();
  const relationshipManager = req.nextUrl.searchParams.get("relationshipManager");
  const businessType       = req.nextUrl.searchParams.get("businessType");
  const status             = req.nextUrl.searchParams.get("status");

  if (id) {
    // --- single-item fetch ---
    try {
      const business = await collection.findOne({ _id: new ObjectId(id) });
      if (!business) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(business);
    } catch {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
  } else {
    // --- list with filters ---
    const filter: any = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { "basic.institutionName": { $regex: regex } },
        { "basic.contactPersonName": { $regex: regex } },
        { "basic.phoneNumber":       { $regex: regex } },
        { "basic.emailAddress":      { $regex: regex } },
      ];
    }

    if (relationshipManager) {
      filter["remarks.relationshipManager"] = relationshipManager;
    }

    if (businessType) {
      // matches the Industry filter from your front end
      filter["basic.businessType"] = businessType;
    }

    if (status) {
      // matches the Status filter
      filter["details.partnershipStatus"] = status;
    }

    try {
      const businesses = await collection.find(filter).toArray();
      return NextResponse.json(businesses);
    } catch (err) {
      console.error("Error fetching businesses", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}

// CREATE new business
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(), // Send back the ID
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}

// UPDATE business by ID
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updates = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

// DELETE business by ID
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
