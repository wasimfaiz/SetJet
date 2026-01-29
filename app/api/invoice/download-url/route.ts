// app/api/invoice/download-url/route.ts
import { NextResponse } from "next/server";
import apiClient from "@/app/utils/apiClient";  // or however you fetch your data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing invoice id" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch your invoice record (or however you look up the stored PDF URL)
    const invoiceRes = await apiClient.get(`/api/invoice?id=${encodeURIComponent(id)}`);
    const invoice = invoiceRes.data;
    // assume `invoice.pdfUrl` is the S3 URL or signed link
    const downloadUrl = invoice.pdfUrl;
    if (!downloadUrl) {
      return NextResponse.json(
        { error: "No PDF URL available for this invoice" },
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
