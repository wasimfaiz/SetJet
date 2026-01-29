"use client";
import { useState } from "react";
import { useEmployeeContext } from "../contexts/employeeContext";
import axios from "axios";
import apiClient from "../utils/apiClient";

interface ReminderModalProps {
  onClose: () => void;
  selectedItem: any;
  type: string;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ onClose, selectedItem, type }) => {
  const [message, setMessage] = useState("");
  const [time, setTime] = useState("");
  const { employeeId } = useEmployeeContext();
console.log(selectedItem);

  const handleSetReminder = async () => {
    if (employeeId) {
      if (!message.trim() || !time) {
        alert("Please fill in all fields.");
        return;
      }
  
      try {
        const { data } = await apiClient.post("/api/reminders/set", {
          employeeId,
          message,
          time,
          targetId: selectedItem?._id,
          type: type
        });  
        if (data.success) {
          console.log("✅ Reminder set!", data.reminderId);
        } else {
          console.error("❌ Error setting reminder:", data.error);
        }
      } catch (error : any) {
        console.error("❌ Error setting reminder:", error.response?.data || error.message);
      }
    }
    onClose();
  };  

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg md:w-96 w-50 shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center justify-center">
        📝 Set Reminder
      </h2>
      
      <div className="space-y-3">
        {/* Message Input */}
        <div>
          <label className="block text-gray-700 font-medium">Reminder Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full text-gray-800 resize-none"
            rows={4}
            placeholder="Enter your reminder message..."
          />
        </div>

        {/* Date-Time Input */}
        <div>
          <label className="block text-gray-700 font-medium">Reminder Time</label>
          <input
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSetReminder}
          className="px-4 py-2 bg-deepblue text-white rounded-lg hover:bg-parrotgreen transition"
        >
          Set Reminder
        </button>
      </div>
    </div>
  </div>
  );
};

export default ReminderModal;
