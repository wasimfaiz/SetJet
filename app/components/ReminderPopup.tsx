"use client";

import { useRouter } from "next/navigation";

interface ReminderPopupProps {
  pollData: any[];
  isVisible: boolean;
  onClose: () => void;
  onClickReminder: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export default function ReminderPopup({
  pollData,
  isVisible,
  onClose,
  onClickReminder,
  onMarkAsRead,
}: ReminderPopupProps) {
  if (!isVisible || !pollData || pollData.length === 0) return null;

  return (
    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50 w-80 max-h-[90vh] overflow-y-auto bg-orange-100 shadow-xl rounded-lg p-6">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold"
        aria-label="Close reminder popup"
      >
        &times;
      </button>

      <h2 className="text-md font-bold text-gray-800 mb-1">Reminders</h2>
      <div className="space-y-2">
        {pollData.map((notification) => {
          const targetId = notification.targetId;

          return (
            <div
              key={notification._id}
              className="p-2 rounded border border-gray-200 shadow-sm"
            >
              <div className="font-semibold text-xs text-gray-900 mb-1">
                {notification.message}
              </div>

              <div className="flex justify-between items-center">
                {/* View Button */}
                <button
                  onClick={() => onClickReminder(notification._id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View
                </button>

                {/* Mark as Read Button */}
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Mark as Read
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
