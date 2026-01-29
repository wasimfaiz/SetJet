// api/request-otp/route.ts
// import { sendOTP } from '@/app/lib/awsSNS';
import { generateOTP, saveOtp } from "@/app/lib/otpStore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Save the OTP for the phone number using MongoDB
    await saveOtp(phoneNumber, otp);

    // Send OTP to phone number using AWS SNS
    // const isSent = await sendOTP(phoneNumber, otp);

    // if (isSent) {
    //   console.log(`OTP sent to ${phoneNumber}: ${otp}`);
    //   return NextResponse.json({ message: 'OTP sent successfully' });
    // } else {
    //   return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
    // }
  } catch (error) {
    console.error("Error in request-otp:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
