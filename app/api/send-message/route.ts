// app/api/send-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sns = new AWS.SNS();

/**
 * POST /api/send-message
 * Body: { phoneNumber: string; link: string; businessId?: string; timestamp?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phoneNumber, link, businessId, timestamp } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { message: "phoneNumber is required" },
        { status: 400 }
      );
    }
    if (!link) {
      return NextResponse.json(
        { message: "link is required" },
        { status: 400 }
      );
    }

    // Normalize phone number: remove non-digits
    let digits = phoneNumber.replace(/\D+/g, "");

    // Ensure country code: if it doesn't start with '91', prefix it
    if (!digits.startsWith("91")) {
      digits = "91" + digits;
    }

    // Format to E.164 with '+'
    const formattedPhone = "+" + digits;

    // Build the SMS message
    const lines = [
      `Your invoice is available here:`,
      link,
      `Thank you!`,
      `Yastudy`
    ].filter(Boolean);
    const message = lines.join("\n");

    // Publish to SNS
    await sns
      .publish({
        Message: message,
        PhoneNumber: formattedPhone,
      })
      .promise();

    return NextResponse.json({ message: "SMS sent successfully" });
  } catch (error: any) {
    console.error("Error in /api/send-message:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
