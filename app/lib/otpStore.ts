// lib/otpStore.ts
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'otps';

/**
 * Save OTP for a given phone number.
 * If an OTP already exists for the number, remove it first.
 * @param phoneNumber 
 * @param otp 
 */
export async function saveOtp(phoneNumber: string, otp: string) {
  const client = await clientPromise;
  const db = client.db(); // Use default database from the connection string
  const collection = db.collection(COLLECTION_NAME);

  // Set expiry for 5 minutes in the future
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  // Remove any existing OTP entries for this phone number
  await collection.deleteMany({ phoneNumber });

  // Insert the new OTP entry
  await collection.insertOne({
    phoneNumber,
    otp,
    expiry,
    createdAt: new Date(),
  });

  console.log(`✅ OTP saved for ${phoneNumber}: ${otp} (Expires at: ${expiry})`);
}

/**
 * Retrieve the OTP entry for a given phone number.
 * @param phoneNumber 
 */
export async function getOtp(phoneNumber: string) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection(COLLECTION_NAME);

  const otpEntry = await collection.findOne({ phoneNumber });
  console.log(`📌 Retrieved OTP for ${phoneNumber}:`, otpEntry);
  return otpEntry;
}

/**
 * Remove OTP entry after verification.
 * @param phoneNumber 
 */
export async function removeOtp(phoneNumber: string) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection(COLLECTION_NAME);

  await collection.deleteMany({ phoneNumber });
}

/**
 * Generate a 6-digit OTP.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
