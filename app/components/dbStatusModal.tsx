import React, { useState, useEffect } from "react";

interface StatusModalProps {
  show: boolean;
  onClose: () => void;
  onStatusChange: (item: string) => void;
}

const DbStatusModal: React.FC<StatusModalProps> = ({
  show,
  onClose,
  onStatusChange,
}) => {
  if (!show) return null;

  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);


  return (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-md p-3 max-w-xs md:max-w-md lg:max-w-lg shadow-lg h-auto max-h-[60vh] overflow-y-auto">
      <h2 className="text-base font-semibold text-center mb-2 text-gray-800">
        Change Status
      </h2>

      {/* Status Buttons - 1 Column on Mobile, 2 Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <button className="py-2 rounded-md bg-parrotgreen text-deepblue text-sm font-medium hover:bg-green-100" onClick={() => onStatusChange("CONVERTED")}>
          CONVERTED
        </button>
        <button className="py-2 rounded-md bg-green-800 text-white text-sm font-medium hover:bg-green-400" onClick={() => onStatusChange("PAYMENT MODE")}>
          PAYMENT MODE
        </button>
        <button className="py-2 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600" onClick={() => onStatusChange("INTERESTED")}>
          INTERESTED
        </button>
        <button className="py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600" onClick={() => onStatusChange("NOT INTERESTED")}>
          NOT INTERESTED
        </button>
        <button className="py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700" onClick={() => onStatusChange("DNP")}>
          DNP
        </button>
        <button className="py-2 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600" onClick={() => onStatusChange("FOLLOW UP")}>
          FOLLOW UP
        </button>
        <button className="py-2 rounded-md bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600" onClick={() => onStatusChange("SWITCH OFF")}>
          SWITCH OFF
        </button>
        <button className="py-2 rounded-md bg-orange-400 text-orange-700 text-sm font-medium hover:bg-orange-500 hover:text-white" onClick={() => onStatusChange("WRONG NUMBER")}>
          WRONG NUMBER
        </button>
        <button className="py-2 rounded-md bg-purple-400 text-purple-700 text-sm font-medium hover:bg-purple-500 hover:text-white" onClick={() => onStatusChange("CALL DISCONNECTED")}>
          CALL DISCONNECTED
        </button>
        <button className="py-2 rounded-md bg-teal-500 text-teal-800 text-sm font-medium hover:bg-teal-600 hover:text-white" onClick={() => onStatusChange("OTHERS")}>
          OTHERS
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 text-center mt-2 text-xs">{error}</div>}

      {/* Cancel Button */}
      <button className="w-full py-2 mt-4 rounded-md bg-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-400" onClick={onClose}>
        CANCEL
      </button>
    </div>
  </div>
  );
};

export default DbStatusModal;
