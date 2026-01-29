import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const databaseCollection = db.collection("student-database-backup");
    const leadsCollection = db.collection("student-leads");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    // Build a search query that filters by name, phoneNumber, or email.
    const query: any = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        {
            $expr: {
              $regexMatch: {
                input: { $toString: "$phoneNumber" },
                regex: search,
                options: "i",
              },
            },
          },
      ];
    }

    // If an id is provided, search each collection individually.
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid ID format" },
          { status: 400 }
        );
      }
      const objectId = new ObjectId(id);
      const doc1 = await databaseCollection.findOne({ _id: objectId });
      if (doc1) return NextResponse.json(doc1, { status: 200 });
      const doc2 = await leadsCollection.findOne({ _id: objectId });
      if (doc2) return NextResponse.json(doc2, { status: 200 });
      return NextResponse.json(
        { error: "No document found with that ID" },
        { status: 404 }
      );
    }

    // Create an aggregation pipeline to union the two collections.
    const pipeline = [
      { $match: query },
      {
        $project: {
          _id: 1,
          name: 1,
          phoneNumber: 1,
          email: 1,
          source: { $literal: "student-database-backup" }
        }
      },
      {
        $unionWith: {
          coll: "student-leads",
          pipeline: [
            { $match: query },
            {
              $project: {
                _id: 1,
                name: 1,
                phoneNumber: 1,
                email: 1,
                source: { $literal: "student-leads" }
              }
            }
          ]
        }
      },
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const combinedDocs = await databaseCollection.aggregate(pipeline).toArray();

    // Get total count by summing counts from both collections.
    const countDb = await databaseCollection.countDocuments(query);
    const countLeads = await leadsCollection.countDocuments(query);
    const totalCount = countDb + countLeads;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        documents: combinedDocs,
        totalCount,
        totalPages,
        currentPage: page
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching combined documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
