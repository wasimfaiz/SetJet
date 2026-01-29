import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("invoices");

    const {
      to,
      mobile,
      date,
      gstNumber,
      from,
      address,
      bank,
      accNo,
      ifsc,
      upi,
      items,
      invoiceNumber,
      invoiceFor,
      courseApplyingFor,
      countryApplyingFor,
      by,
      paymentMode
    } = await request.json();

    if (
      !to ||
      !mobile ||
      !date ||
      !invoiceNumber ||
      !items ||
      !Array.isArray(items)
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // Check if invoiceNumber already exists
    const existingInvoice = await collection.findOne({ invoiceNumber });
    if (existingInvoice) {
      return NextResponse.json(
        {
          error:
            "Invoice number already exists. Please use a unique number.",
        },
        { status: 400 }
      );
    }

    // Parse and store the 'date' as a Date object:
    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format"); // Important for error handling
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      return NextResponse.json(
        { error: "Invalid date format for 'date'" },
        { status: 400 }
      );
    }

    const now = new Date();

    const newInvoice = {
      to,
      mobile,
      date: parsedDate, // Store the parsed Date object
      gstNumber,
      from,
      address,
      bank,
      accNo,
      ifsc,
      upi,
      items,
      invoiceNumber,
      invoiceFor,
      countryApplyingFor,
      courseApplyingFor,
      by,
      createdAt: now,
      updatedAt: now, // Set updatedAt to now on creation
    };

    const result = await collection.insertOne(newInvoice);

    if (!result.insertedId) {
      console.error("Invoice insertion failed:", result);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      message: "Invoice created successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper to calculate totals from invoice items
function calculateInvoiceTotals(invoice: any) {
  let totalAmount = 0;
  let paidAmount = 0;
  let balanceAmount = 0;

  if (Array.isArray(invoice.items)) {
    for (const item of invoice.items) {
      totalAmount += parseFloat(item.totalamount || "0");
      paidAmount += parseFloat(item.paidamount || "0");
      balanceAmount += parseFloat(item.balanceamount || "0");
    }
  }

  return { totalAmount, paidAmount, balanceAmount };
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("invoices");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");
    const dateRangeParam = searchParams.get("dateRange");
    const invoiceFor = searchParams.get("invoiceFor");
    const countryApplyingFor = searchParams.get("countryApplyingFor");
    const pagination = searchParams.get("pagination");
    const saleEmp = searchParams.get("saleEmp");
    const refund = searchParams.get("refund");

    // ——————————————
    // Single-invoice fetch
    // ——————————————
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
      }

      const invoice = await collection.findOne({ _id: new ObjectId(id) });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      const totals = calculateInvoiceTotals(invoice);

      return NextResponse.json({
        invoice: {
          ...invoice,
          ...totals,
        },
      });
    }

    // Build filter object
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

    if (refund === "REFUNDED") {
      filter.refundDetails = { $exists: true, $ne: [] };
    } else if (refund === "NOT REFUNDED") {
      filter.$or = [
        { refundDetails: { $exists: false } },
        { refundDetails: { $eq: [] } },
      ];
    }
    // ——————————————
    // Paginated invoices
    // ——————————————
    if (pagination !== "manual") {
      const pageNumber = parseInt(page || "1", 10);
      const limitNumber = parseInt(limit || "10", 10);

      if (isNaN(pageNumber) || isNaN(limitNumber)) {
        return NextResponse.json({ error: "Invalid page or limit value" }, { status: 400 });
      }

      const skip = (pageNumber - 1) * limitNumber;
      const totalInvoices = await collection.countDocuments(filter);
      const totalPages = Math.ceil(totalInvoices / limitNumber);

      const rawInvoices = await collection
        .find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .toArray();

      const invoices = rawInvoices.map((invoice) => ({
        ...invoice,
        ...calculateInvoiceTotals(invoice),
      }));

      return NextResponse.json({ invoices, totalPages });
    }

    // ——————————————
    // Manual mode (no pagination)
    // ——————————————
    const rawInvoices = await collection
      .find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const invoices = rawInvoices.map((invoice) => ({
      ...invoice,
      ...calculateInvoiceTotals(invoice),
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error retrieving invoices:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
      const client = await clientPromise;
      const db = client.db("mydatabase");
      const collection = db.collection("invoices");

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id || !ObjectId.isValid(id)) {
          return NextResponse.json(
              { error: "Invalid or missing ID" },
              { status: 400 }
          );
      }

    // Pull off any forbidden fields
      const incoming = await request.json();
      delete incoming._id;
      delete incoming.createdAt;

    // Always set updatedAt
      const now = new Date();
      incoming.updatedAt = now;

      if (incoming.date) {
          try {
              const parsedDate = new Date(incoming.date);
              if (isNaN(parsedDate.getTime())) {
                  return NextResponse.json(
                      { error: "Invalid date format for 'date'" },
                      { status: 400 }
                  );
              }
              incoming.date = parsedDate;
          } catch (error) {
              return NextResponse.json(
                  { error: "Invalid date format for 'date'" },
                  { status: 400 }
              );
          }
      }

      const result = await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: incoming }
      );

      if (result.matchedCount === 0) {
          return NextResponse.json(
              { error: "Invoice not found" },
              { status: 404 }
          );
      }

       // Optionally, return the updated document
      const updatedDoc = await collection.findOne({ _id: new ObjectId(id) });

      return NextResponse.json(
          { message: "Invoice updated successfully", id },
          { status: 200 }
      );
  } catch (error) {
      console.error("Error updating invoice:", error);
      return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
      );
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("mydatabase");
    const collection = db.collection("invoices");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}