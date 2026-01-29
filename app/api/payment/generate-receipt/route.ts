import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      serviceName,
      amount,
      transactionId,
      paidAt,
      applicationId
    } = body;

    // Create a new PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([600, 750]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const blue = rgb(0, 0.2, 0.5);

    // Title
    page.drawText("Payment Receipt", {
      x: 200,
      y: 700,
      size: 22,
      font: bold,
      color: blue,
    });

    // Application ID
    page.drawText(`Application ID: ${applicationId}`, {
      x: 50,
      y: 660,
      size: 12,
      font,
    });

    // Main details
    page.drawText(`Name: ${name}`, { x: 50, y: 620, size: 14, font });
    page.drawText(`Service: ${serviceName}`, { x: 50, y: 590, size: 14, font });
    page.drawText(`Amount: ₹${amount}`, { x: 50, y: 560, size: 14, font });
    page.drawText(`Transaction ID: ${transactionId}`, { x: 50, y: 530, size: 14, font });
    page.drawText(`Paid At: ${paidAt}`, { x: 50, y: 500, size: 14, font });

    // Footer
    page.drawText("Thank you for your payment!", {
      x: 50,
      y: 460,
      size: 13,
      font: bold,
      color: blue,
    });

    const pdfBytes = await pdf.save();

    // FIX: Convert Uint8Array → ArrayBuffer
    const arrayBuffer = pdfBytes.slice().buffer;

    return new NextResponse(arrayBuffer, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=receipt-${transactionId}.pdf`,
  },
});
    

  } catch (error) {
    console.log("PDF ERROR:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
