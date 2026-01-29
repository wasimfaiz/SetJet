import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-leads");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const searchTerm = url.searchParams.get("searchTerm");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const timeFrame = url.searchParams.get("timeframe");
    const category = url.searchParams.get("category");
    const sortParam = url.searchParams.get("sort"); // e.g. "ascending" or "descending"
    const assignId = url.searchParams.get("assignId");
    const assigned = url.searchParams.get("assigned");
    const date = url.searchParams.get("date");
    const calledAtDate = url.searchParams.get("calledAtDate");
    const course = url.searchParams.get("course");

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Calculate date ranges for weekly and monthly filters
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(todayDate - 6);
    const startOfMonth = new Date(todayYear, todayMonth, 1);

    // Build query for fetching students
    const query: any = {};

    if (status) {
      if (status === "TRANSFER") {
        query.transferAt = { $exists: true };
      } else if (status !== "ALL") {
        query.status = status;
      }
    }
    if (date) {
      // Compare only the date part (first 10 characters)
      query.$expr = { $eq: [{ $substr: ["$createdAt", 0, 10] }, date] };
    }
    if (calledAtDate) {
      query.$expr = {
        $anyElementTrue: {
          $map: {
            input: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$calledAt", null] },
                    { $not: { $isArray: "$calledAt" } }
                  ]
                },
                then: [],
                else: "$calledAt"
              }
            },
            as: "date",
            in: { $eq: [{ $substr: ["$$date", 0, 10] }, calledAtDate] }
          }
        }
      };
    }
    if (assigned) {
      query.to = assigned === "ASSIGNED" ? { $exists: true } : { $exists: false };
    }
    if (category) {
      query.leadCategory = category;
    }
    if (course) {
      query.course = course;
    }
    if (assignId) {
      query.to = assignId;
    }
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" },
              regex: searchTerm,
              options: "i",
            },
          },
        },
      ];
    }

    // Time frame filters
    if (timeFrame === "today") {
      const startOfToday = new Date(todayYear, todayMonth, todayDate);
      const endOfToday = new Date(todayYear, todayMonth, todayDate + 1);
      query.statusUpdatedAt = {
        $gte: startOfToday.toISOString(),
        $lt: endOfToday.toISOString(),
      };
    } else if (timeFrame === "weekly") {
      query.statusUpdatedAt = {
        $gte: startOfLastWeek.toISOString(),
        $lte: today.toISOString(),
      };
    } else if (timeFrame === "monthly") {
      query.statusUpdatedAt = {
        $gte: startOfMonth.toISOString(),
        $lte: today.toISOString(),
      };
    }

    // Prepare the aggregation pipeline.
    // Use $addFields to convert createdAt to a Date (works if it's a string or already a Date)
    const pipeline = [
      { $match: query },
      { $addFields: { createdAtDate: { $toDate: "$createdAt" } } },
      { $sort: { createdAtDate: -1 } }, // Latest first
    ];

    let students;
    let totalCount;
    let currentPage = 1;
    let totalPages = 1;

    if (url.searchParams.has("page") && url.searchParams.has("limit")) {
      const skip = (page - 1) * limit;
      //@ts-ignore
      pipeline.push({ $skip: skip }); pipeline.push({ $limit: limit });
      totalCount = await collection.countDocuments(query);
      currentPage = page;
      totalPages = Math.ceil(totalCount / limit);
      students = await collection.aggregate(pipeline).toArray();
    } else {
      students = await collection.aggregate(pipeline).toArray();
      totalCount = students.length;
    }

    // Instead of returning an empty array when no documents found,
    // we return the complete structure with default values.
    if (students.length === 0) {
      return NextResponse.json(
        {
          students: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          statusCounts: {},
          transferCount: 0,
        },
        { status: 200 }
      );
    }

    // Aggregation for status counts (ignoring status filter)
    const aggregationQuery = { ...query };
    if (aggregationQuery.status) {
      delete aggregationQuery.status;
    }
    const statusAggregation = await collection.aggregate([
      { $match: aggregationQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const formattedStatusCounts = statusAggregation.reduce((acc, item) => {
      acc[item._id || "UNKNOWN"] = item.count;
      return acc;
    }, {});

    // Count total calls (documents with a 'calledAt' field)
    const totalCallsQuery = { ...query, calledAt: { $exists: true } };
    if (totalCallsQuery.status) {
      delete totalCallsQuery.status;
    }
    const totalCallsCount = await collection.countDocuments(totalCallsQuery);
    formattedStatusCounts["TOTAL CALLS"] = totalCallsCount;

    // Count transfer leads (where transferAt exists)
    const transferCount = await collection.countDocuments({
      ...query,
      transferAt: { $exists: true },
    });

    return NextResponse.json(
      {
        students,
        totalCount,
        totalPages,
        currentPage,
        statusCounts: formattedStatusCounts,
        transferCount,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

