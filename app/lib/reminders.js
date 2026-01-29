// lib/reminders.js
import { ObjectId } from "mongodb";
import { clientPromise } from "../db/mongodb.js";

export async function getDueReminders() {
  const client = await clientPromise;
  const db = client.db();
  
  // Get the current time as an ISO string (just the date and time part, no milliseconds or timezone offset)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const createdAt = new Date(now.getTime() + istOffset);
  
  const currentTimeISO = createdAt.toISOString().slice(0, 16); // Format it to "YYYY-MM-DDTHH:MM" (like the reminder time format)

  // Fetch reminders where the time matches the current time exactly
  const reminders = await db
    .collection("reminders")
    .find({
      time: currentTimeISO,  // Match the time string exactly
      notified: false,
    })
    .toArray();

  return reminders;
}

//@ts-ignore
export async function markSent(id, sentAt) {
  const client = await clientPromise;
  const db = client.db();

  await db.collection("reminders").updateOne(
    { _id: typeof id === "string" ? new ObjectId(id) : id },
    { $set: { notified: true, notifiedAt: sentAt } }
  );
}
