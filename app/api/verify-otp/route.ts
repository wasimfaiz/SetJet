import { NextRequest, NextResponse } from 'next/server';
import { getOtp, removeOtp } from '@/app/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp } = await req.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { message: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // 1) Pull stored OTP
    const stored = await getOtp(phoneNumber);
    if (!stored) {
      return NextResponse.json(
        { message: "OTP not found. Please request a new one." },
        { status: 400 }
      );
    }

    // 2) Check expiry
    if (new Date() > stored.expiry) {
      await removeOtp(phoneNumber);
      return NextResponse.json(
        { message: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3) Check match
    if (stored.otp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // 4) Success! Remove entry so it can’t be reused.
    await removeOtp(phoneNumber);

    // 5) Return success—no user creation or JWT here.
    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in verify-otp:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
