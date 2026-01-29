import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

console.log("🔍 MONGODB_URI =", process.env.MONGODB_URI); // Add this

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(process.env.MONGODB_URI);
export const clientPromise = client.connect();
