import React from "react";

interface StatusModalProps {
  show: boolean;
  onClose: () => void;
  onStatusChange: (item: String) => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  show,
  onClose,
  onStatusChange,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-center mb-6 text-gray-800">
          Change status to:
        </h2>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button
            className="w-full py-2 px-4 rounded-lg bg-green-500 text-white text-lg font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200"
            onClick={() => onStatusChange("DONE")}
          >
            Done
          </button>
          <button
            className="w-full py-2 px-4 rounded-lg bg-yellow-500 text-white text-lg font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-all duration-200"
            onClick={() => onStatusChange("PROGRESS")}
          >
           IN PROGRESS
          </button>
          <button
            className="w-full py-2 px-4 rounded-lg bg-red-500 text-white text-lg font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200"
            onClick={() => onStatusChange("PENDING")}
          >
            PENDING
          </button>
        </div>
        <div className="flex justify-between">
          <button
            className="w-full py-2 px-4 rounded-lg bg-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
