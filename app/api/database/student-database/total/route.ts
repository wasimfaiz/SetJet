import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const searchTerm = url.searchParams.get("searchTerm");
    const page = parseInt(url.searchParams.get("page") || "1", 10); // Default to page 1
    const limit = parseInt(url.searchParams.get("limit") || "10", 10); // Default to 10 items per page
    const timeFrame = url.searchParams.get("timeframe"); // Time frame filter

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Calculate date ranges for weekly and monthly filters
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(todayDate - 6);

    const startOfMonth = new Date(todayYear, todayMonth, 1);

    // Build the query
    let query: any = {};

    // Status filter
    if (status) {
      if (status === "TRANSFER") {
        query.transferAt = { $exists: true }; // Only fetch records with the 'transferAt' field
      } else {
        query.status = status;
      }
    }

    // Search term filter
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search for name
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" }, // Convert phoneNumber to a string
              regex: searchTerm,
              options: "i", // Case-insensitive
            },
          },
        },
      ];
    }

    // Time frame filters
    if (timeFrame === "today") {
      const startOfToday = new Date(todayYear, todayMonth, todayDate);
      const endOfToday = new Date(todayYear, todayMonth, todayDate + 1);
      query.statusUpdatedAt = { $gte: startOfToday.toISOString(), $lt: endOfToday.toISOString() };
      } else if (timeFrame === "weekly") {
      query.statusUpdatedAt = { $gte: startOfLastWeek.toISOString(), $lte: today.toISOString() };
      } else if (timeFrame === "monthly") {
      query.statusUpdatedAt = { $gte: startOfMonth.toISOString(), $lte: today.toISOString() };
      }
    // Fetch the entire dataset to reverse it before pagination
    const allStudents = await collection.find(query).toArray();
    const reversedAllStudents = allStudents.reverse();

    // Calculate pagination parameters
    const totalCount = reversedAllStudents.length;
    const totalPages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    // Slice the reversed dataset to get the current page
    const studentsForPage = reversedAllStudents.slice(start, end);

    // Reverse the individual section fetched for this page
    // const reversedPage = studentsForPage.reverse();

    // Aggregation pipeline to group by status and count students
    const statusCounts = await collection.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Count the total number of students with 'transferAt' field (TRANSFER logic)
    const transferCount = await collection.countDocuments({
      ...query,
      transferAt: { $exists: true },
    });

    // Format the status counts
    const formattedStatusCounts = statusCounts.reduce((acc, item) => {
      acc[item._id || "UNKNOWN"] = item.count; // Handle cases where status might be null/undefined
      return acc;
    }, {});

    return NextResponse.json(
      {
        students: studentsForPage,
        totalCount,
        totalPages,
        currentPage: page,
        statusCounts: formattedStatusCounts,
        transferCount,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


