import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { write, utils } from "xlsx";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("student-database-backup");

    const query: any = { databaseId: id };
    if (status && status !== "ALL") {
      query.status = status;
    }

    const students = await collection.find(query).toArray();

    if (!students.length) {
      return NextResponse.json({ error: "No data found." }, { status: 404 });
    }

    const filtered = students.map(({ name, email, phoneNumber, state, status, remark }) => ({
      name,
      email,
      phoneNumber,
      state,
      status,
      remark,
    }));

    const worksheet = utils.json_to_sheet(filtered);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Students");

    const excelBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=student-database-${id}${status && status !== "ALL" ? `-${status}` : ""}.xlsx`,
      },
    });
  } catch (error) {
    console.error("❌ Export failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
