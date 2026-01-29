import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("invoices");

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const dateRangeParam = searchParams.get("dateRange");
    const invoiceFor = searchParams.get("invoiceFor");
    const countryApplyingFor = searchParams.get("countryApplyingFor");
    const saleEmp = searchParams.get("saleEmp");

    const filter: any = {};

    if (search) {
      filter.$or = [
        { to: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (dateRangeParam) {
      try {
        const { startDate, endDate } = JSON.parse(dateRangeParam);
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          filter.date = {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
          };
        }
      } catch {
        return NextResponse.json({ error: "Invalid dateRange format" }, { status: 400 });
      }
    }

    if (invoiceFor) {
      filter.invoiceFor = { $regex: invoiceFor, $options: "i" };
    }

    if (countryApplyingFor) {
      filter.countryApplyingFor = { $regex: countryApplyingFor, $options: "i" };
    }

    if (saleEmp) {
      filter.salesEmployee = { $regex: saleEmp, $options: "i" };
    }

    const invoices = await collection.find(filter).toArray();

    let totalAmount = 0;
    let paidAmount = 0;
    let balanceAmount = 0;
    let refundAmount = 0;

    for (const invoice of invoices) {
      // Sum refundAmounts from refundDetails array
      if (Array.isArray(invoice.refundDetails)) {
        for (const refund of invoice.refundDetails) {
          const amt = parseFloat(refund.refundAmount || "0");
          if (!isNaN(amt)) refundAmount += amt;
        }
      }

      if (!Array.isArray(invoice.items)) continue;

      for (const item of invoice.items) {
        const total = parseFloat(item.totalamount || "0");
        const paid = parseFloat(item.paidamount || "0");
        const balance = parseFloat(item.balanceamount || "0");

        if (!isNaN(total)) totalAmount += total;
        if (!isNaN(paid)) paidAmount += paid;
        if (!isNaN(balance)) balanceAmount += balance;
      }
    }

    return NextResponse.json({
      totalAmount,
      paidAmount,
      balanceAmount,
      refundAmount,
    });
  } catch (error) {
    console.error("❌ Failed to calculate invoice summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
