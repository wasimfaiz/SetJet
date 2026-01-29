import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { write, utils } from "xlsx";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const searchTerm = url.searchParams.get("searchTerm");
    const timeFrame = url.searchParams.get("timeframe");
    const category = url.searchParams.get("category");
    const sortParam = url.searchParams.get("sort");
    const assignId = url.searchParams.get("assignId");
    const assigned = url.searchParams.get("assigned");
    const date = url.searchParams.get("date");
    const calledAtDate = url.searchParams.get("calledAtDate");
    const course = url.searchParams.get("course");

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(todayDate - 6);
    const startOfMonth = new Date(todayYear, todayMonth, 1);

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-leads");

    const query: any = {};

    if (status && status !== "ALL") {
      if (status === "TRANSFER") {
        query.transferAt = { $exists: true };
      } else {
        query.status = status;
      }
    }

    if (date) {
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

    if (timeFrame === "today") {
      const start = new Date(todayYear, todayMonth, todayDate);
      const end = new Date(todayYear, todayMonth, todayDate + 1);
      query.statusUpdatedAt = { $gte: start.toISOString(), $lt: end.toISOString() };
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

    const pipeline = [
      { $match: query },
      { $addFields: { createdAtDate: { $toDate: "$createdAt" } } },
      { $sort: { createdAtDate: sortParam === "ascending" ? 1 : -1 } }
    ];

    const students = await collection.aggregate(pipeline).toArray();

    if (!students.length) {
      return NextResponse.json({ error: "No data found." }, { status: 404 });
    }

    // Filter for export fields
    const filtered = students.map((s) => ({
      name: s.name || "",
      email: s.email || "",
      phoneNumber: s.phoneNumber || "",
      state: s.state || "",
      status: s.status || "",
      remark: s.remark || "",
      address: s.address || "",
      counsellorName: s.counsellorName || "",
      country: s.country || "",
      course: s.course || "",
      date: s.date || "",
      gender: s.gender || "",
      leadCategory: s.leadCategory || "",
      tenthPercent: s.tenthPercent || "",
      twelfthPercent: s.twelfthPercent || "",
      ugPercent: s.ugPercent || "",
      pgPercent: s.pgPercent || "",
    }));

    const worksheet = utils.json_to_sheet(filtered);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Students");

    const excelBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=student-leads-export.xlsx`,
      },
    });
  } catch (error) {
    console.error("❌ Export failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
