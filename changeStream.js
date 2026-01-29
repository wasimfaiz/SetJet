import dotenv from "dotenv";
dotenv.config();

import clientPromise from "./app/lib/mongodb-connection.js";
import axios from "axios";

// Templates
import { welcomeEmail } from "./app/email/welcomeEmail.ts";
import { emailUpdatedTemplate } from "./app/email/emailUpdatedTemplate.ts";
import { paymentReceivedTemplate } from "./app/email/paymentReceivedTemplate.ts";
import { paymentReceiptTemplate } from "./app/email/paymentReceiptTemplate.ts";
import { paymentFailedTemplate } from "./app/email/paymentFailedTemplate.ts";

const ADMIN_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://admin.yastudy.com";

/**
 * Decide which email template to send
 */
function buildEmailTemplate(updatedFields, doc) {
  console.log("🔍 Updated Fields:", updatedFields);

  // 1️⃣ Email updated
  if (updatedFields.email) {
    return {
      subject: "Your Email Was Updated ✔",
      html: emailUpdatedTemplate(doc.name || "User", updatedFields.email),
    };
  }

  // 2️⃣ Payment Status → RECEIVED
  if (updatedFields.paymentStatus === "PAID") {
    const htmlReceived = paymentReceivedTemplate(
      doc.name || "User",
      doc.serviceName || "Service Payment",
      doc.amount,
      doc.orderId
    );

    const htmlReceipt = paymentReceiptTemplate({
      name: doc.name || "User",
      serviceName: doc.serviceName || "Service Payment",
      amount: doc.amount,
      transactionId: doc.orderId,
      paidAt: new Date().toISOString(),
      receiptUrl: `${ADMIN_BASE_URL}/receipt/${doc.orderId}`,
      applicationId: doc.orderId,
    });

    return {
      subject: "Payment Successful ✔",
      html: `${htmlReceived}<br/>${htmlReceipt}`,
    };
  }

  // 3️⃣ Payment Status → FAILED
  if (updatedFields.paymentStatus === "FAILED") {
    return {
      subject: "Payment Failed ❌",
      html: paymentFailedTemplate(
        doc.name || "User",
        doc.serviceName || "Service Payment",
        doc.amount,
        doc.orderId
      ),
    };
  }

  // 4️⃣ Payment receipt URL added
  if (updatedFields.paymentReceiptUrl) {
    return {
      subject: "Your Payment Receipt",
      html: paymentReceiptTemplate({
        name: doc.name || "User",
        serviceName: doc.serviceName || "Service Payment",
        amount: doc.amount,
        transactionId: doc.orderId,
        paidAt: doc.paidAt || new Date().toISOString(),
        receiptUrl: doc.paymentReceiptUrl,
        applicationId: doc.orderId,
      }),
    };
  }

  // 5️⃣ New account created
  if (updatedFields.accountCreated === true) {
    return {
      subject: "Welcome to YaStudy 🎉",
      html: welcomeEmail(doc),
    };
  }

  return null;
}

/**
 * Start MongoDB Change Stream
 */
async function startChangeStream() {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");

  console.log("🚀 Change Stream Listening for User Updates...");

  const stream = users.watch();

  stream.on("change", async (event) => {
    if (event.operationType !== "update") return;

    const updatedFields = event.updateDescription.updatedFields;
    const userId = event.documentKey._id;

    const doc = await users.findOne({ _id: userId });

    console.log("🧾 FULL DOCUMENT:", JSON.stringify(doc, null, 2));

    const template = buildEmailTemplate(updatedFields, doc);

    if (!template) {
      console.log("⚠ No email template matched. Skipped.");
      return;
    }

    console.log("📨 Sending email:", template.subject);

    try {
      await axios.post(`${ADMIN_BASE_URL}/api/email`, {
        subject: template.subject,
        html: template.html,
        userId,
        to: doc.email, // ← Send to user's stored email
      });

      console.log("✔ Email Sent Successfully!");
    } catch (err) {
      console.error("❌ Failed to send email:", err.message);
    }
  });

  stream.on("error", (err) => {
    console.error("❌ Change Stream Error:", err);
    console.log("⏳ Restarting in 5 seconds...");
    setTimeout(startChangeStream, 5000);
  });
}

startChangeStream();
