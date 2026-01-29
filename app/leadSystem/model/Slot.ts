// models/Slot.ts
// This is a TypeScript interface + helper functions
// No Mongoose required

export interface Slot {
  _id?: string;
  course: "IELTS" | "GERMAN";
  date: string; // YYYY-MM-DD format
  timeSlot: string; // e.g. "08:00 am to 09:30 am"
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Optional: Helper to format display string (can be used in API or frontend)
export const formatSlotDisplay = (slot: Slot): string => {
  const date = new Date(slot.date);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();

  const getOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const displayDate = `${getOrdinal(day)} ${month} ${year}`;
  return `${displayDate} - ${slot.timeSlot} (${slot.course})`;
};