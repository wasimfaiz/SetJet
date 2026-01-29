import { clientPromise } from "../db/mongodb.js";
import { ObjectId } from "mongodb";

export async function getEmployeeById(employeeId) {
  try {
    const client = await clientPromise;
    const db = client.db(); // use your DB name if needed
    const employee = await db
      .collection("employees")
      .findOne({ _id: new ObjectId(employeeId) });

    return employee;
  } catch (error) {
    console.error("❌ Error fetching employee:", error);
    return null;
  }
}
