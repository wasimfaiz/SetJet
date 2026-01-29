import { NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL;
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;

const ADMIN_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://admin.yastudy.com";

export async function POST(req: Request) {
  try {
    const { amount, orderId, userId, serviceName } = await req.json();

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId,
      amount: amount * 100,
      redirectUrl: "/",
      redirectMode: "REDIRECT",
      callbackUrl: "/",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

    const stringToHash = `${base64Payload}/pg/v1/pay${SALT_KEY}`;
    const checksum = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerifyHeader = `${checksum}###${SALT_INDEX}`;

    // CALL PHONEPE API
    const response = await axios.post(
      PHONEPE_BASE_URL!,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyHeader,
        },
      }
    );

    const phonePeResponse = response.data;

    const client = await clientPromise;
    const db = client.db("mydatabase");
    const users = db.collection("users");

    // ==============================
    // 🔥 UPDATE MONGO → CHANGE STREAM SENDS EMAIL
    // ==============================

    if (phonePeResponse.success === true) {
      console.log("✔ Payment Success — updating MongoDB…");

      await users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            paymentStatus: "PAID",
            amount,
            orderId,
            serviceName,
            paidAt: new Date(),
          },
        }
      );
    } else {
      console.log("❌ Payment Failed — updating MongoDB…");

      await users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            paymentStatus: "FAILED",
            amount,
            orderId,
            serviceName,
          },
        }
      );
    }

    return NextResponse.json({ data: phonePeResponse });
  } catch (error) {
    console.log("Payment error:", error);
    return NextResponse.json(
      { message: "Payment processing error" },
      { status: 500 }
    );
  }
}
