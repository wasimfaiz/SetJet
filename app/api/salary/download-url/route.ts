// app/api/salary/download-url/route.ts
import { NextResponse } from "next/server";
import apiClient from "@/app/utils/apiClient";  // or however you fetch your data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing salary id" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch your salary record (or however you look up the stored PDF URL)
    const salaryRes = await apiClient.get(`/api/salary?id=${encodeURIComponent(id)}`);
    const salary = salaryRes.data;
    // assume `salary.pdfUrl` is the S3 URL or signed link
    const downloadUrl = salary.pdfUrl;
    if (!downloadUrl) {
      return NextResponse.json(
        { error: "No PDF URL available for this salary" },
        { status: 404 }
      );
    }

    // 2️⃣ Return the URL
    return NextResponse.json({ downloadUrl }, { status: 200 });
  } catch (err: any) {
    console.error("Error in download-url GET:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
