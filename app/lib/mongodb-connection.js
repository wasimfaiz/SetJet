import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // Loads .env for non-Next.js environments (safe)

// Ensure env exists
if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI missing in .env file");
}

const uri = process.env.MONGODB_URI;

let client;
let clientPromise;

// Prevent multiple connections in dev mode
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
