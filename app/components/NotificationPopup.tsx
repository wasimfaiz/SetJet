"use client";

import { useRouter } from "next/navigation";

interface NotificationPopupProps {
  pollData: any[];
  isVisible: boolean;
  onClose: () => void;
}

export default function NotificationPopup({ pollData, isVisible, onClose }: NotificationPopupProps) {
  const router = useRouter();

  console.log("🔔 NotificationPopup received pollData:", pollData);

  if (!isVisible || !pollData || pollData.length === 0) return null;

  return (
    <div className="absolute top-10 right-2 z-50 w-80 max-h-[90vh] overflow-y-auto bg-white shadow-xl rounded-lg p-6">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold"
        aria-label="Close notification popup"
      >
        &times;
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">You have a new notification!</h2>
      <div className="space-y-4">
        {pollData.map((notification) => (
          <div key={notification._id} className="p-3 rounded border border-gray-200 shadow-sm cursor-pointer">
            <div className="font-semibold text-gray-900"><div dangerouslySetInnerHTML={{ __html: notification.name }} /></div>
            {notification.desc && (
              <div className="text-sm text-gray-600 mt-1">{notification.desc}</div>
            )}
            {notification.priority && (
              <div className="text-xs text-red-500 mt-1">Priority: {notification.priority}</div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              From: {notification.by?.employeeName ?? "Website"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
