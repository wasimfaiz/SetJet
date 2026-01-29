import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // Adjust the path if necessary
import { ObjectId } from "mongodb";

interface Offer {
  name: string;
  startDate: Date;
  endDate: Date;
  off: string;
}

// Function to connect to MongoDB and get the offers collection
async function getOffersCollection() {
  const client = await clientPromise; // Using clientPromise for connection
  const db = client.db("mydatabase");
  return db.collection<Offer>("offers");
}

// POST API - Create Offer
export async function POST(request: Request) {
  const { name, startDate, endDate, off }: Offer = await request.json();

  if (!name || !startDate || !endDate || !off) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const offersCollection = await getOffersCollection();
    const result = await offersCollection.insertOne({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      off,
    });

    return NextResponse.json(
      { message: "Offer created successfully", offerId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

// GET API by Name - Get Offer by Name
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id"); // Get ID from query params
  const name = url.searchParams.get("name"); // Get name from query params

  try {
    const offersCollection = await getOffersCollection();

    // If ID is provided, fetch offer by ID
    if (id) {
      const offer = await offersCollection.findOne({ _id: new ObjectId(id) }); // Assuming the ID is in ObjectId format
      if (!offer) {
        return NextResponse.json({ error: "INVALID OFFER" }, { status: 404 });
      }
      return NextResponse.json(offer, { status: 200 });
    }

    // If name is provided, fetch offer by name
    if (name) {
      const offer = await offersCollection.findOne({ name });
      if (!offer) {
        return NextResponse.json({ error: "INVALID OFFER" }, { status: 404 });
      }
      return NextResponse.json(offer, { status: 200 });
    }

    // If neither ID nor name is provided, fetch all offers
    const offers = await offersCollection.find().toArray();
    return NextResponse.json(offers, { status: 200 });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}
// PUT API - Update Offer by ID
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid or missing ID" },
      { status: 400 }
    );
  }

  const { name, startDate, endDate, off }: Partial<Offer> =
    await request.json();

  if (!name && !startDate && !endDate && !off) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const offersCollection = await getOffersCollection();
    const updates: Partial<Offer> = {};

    if (name) updates.name = name;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate) updates.endDate = new Date(endDate);
    if (off) updates.off = off;

    const result = await offersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No offer found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Offer updated successfully" });
  } catch (error) {
    console.error("Failed to update offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}

// DELETE API - Delete Offer by ID
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
    const offersCollection = await getOffersCollection();
    const result = await offersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No offer found with that ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Failed to delete offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
