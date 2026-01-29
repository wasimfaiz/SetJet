export const checkButtonVisibility = (
  permissions: Record<string, string[]> | "all",
  tab: string,
  action: "add" | "edit" | "delete" | "view"
): boolean => {
  if (permissions === "all") {
    return true; // Allow access to all actions if "all" permission is granted
  }

  if (!permissions || !permissions[tab]) {
    return false; // No permissions available for this tab
  }

  return permissions[tab]?.includes(action); // Check if the action is allowed for the tab
};
export const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",  // e.g., "Fri"
    day: "numeric",    // e.g., "15" (day of the month)
    month: "short",    // e.g., "Jan"
    year: "numeric",   // e.g., "2025"
    hour: "2-digit",   // e.g., "11"
    minute: "2-digit", // e.g., "36"
    hour12: true,      // e.g., "AM"
    timeZone: "UTC"    // Use UTC so that the time doesn't convert to IST
  };
  return date.toLocaleString("en-IN", options);
};

console.log(formatDateTime("2025-01-15T11:36:19.523Z"));
// Expected output (approximately): "Fri, 15 Jan, 2025, 11:36 AM"   
