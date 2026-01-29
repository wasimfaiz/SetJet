// app/api/invoice/send-whatsapp/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import axios from "axios";
import FormData from "form-data";
import { Buffer } from "buffer";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, toNumber, customerName } = await req.json();

    // 1. Generate your PDF in memory (replace with your real invoice logic)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    page.drawText(`Invoice ID: ${invoiceId}`, { x: 50, y: 550 });
    // … add more invoice details …
    const pdfBytes = await pdfDoc.save();

    // 2. Wrap PDF bytes in a Buffer
    const buffer = Buffer.from(pdfBytes);

    // 3. Prepare the multipart/form-data
    const form = new FormData();
    form.append("file", buffer, {
      filename: "invoice.pdf",
      contentType: "application/pdf",
    });
    // ⚠️ must be "document"
    form.append("type", "document");

    // 4. Upload to WhatsApp Cloud API
    const token = process.env.WHATSAPP_TOKEN!;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const uploadRes = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
      }
    );
    const mediaId = uploadRes.data.id;

    // 5. Send the document message
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "document",
        document: {
          id: mediaId,
          caption: `Hello ${customerName}, here is your invoice.`,
          filename: "invoice.pdf",
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-whatsapp error", err.response?.data || err.message);
    return NextResponse.json({ error: err.response?.data || err.message }, { status: 500 });
  }
}
