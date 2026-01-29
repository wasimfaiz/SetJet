import React, { useState, useEffect } from "react";

interface StatusModalProps {
  show: boolean;
  onClose: () => void;
  onTransferClient?: (item: any) => void;
}

const TransferModal: React.FC<StatusModalProps> = ({
  show,
  onClose,
  onTransferClient
}) => {
  if (!show) return null;

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees?status=ACTIVE");
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setEmployees(data);
        } else {
          throw new Error("Expected JSON response, but received non-JSON content.");
        }
      } catch (error: any) {
        setError(error.message || "Error fetching employees");
        console.error("Error fetching employees:", error);
      }
    };

    if (show) fetchEmployees();
  }, [show]);

  const handleTransfer = () => {
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    const selectedEmployeeData = employees.find(
      (emp) => emp._id === selectedEmployee
    );

    if (selectedEmployeeData && onTransferClient) {
      const payload = {
        id: selectedEmployeeData._id,
        name: selectedEmployeeData?.basicField.name,
      };
      onTransferClient(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-3 w-72 max-w-xs shadow-lg h-auto max-h-[70vh] overflow-y-auto flex flex-col">
        <div className="relative mt-3">
          <h2 className="text-base font-semibold text-center mb-2 text-gray-800">
            Transfer to :
          </h2>
          <select
            className="w-full py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedEmployee || ""}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="" disabled>
              Select an employee
            </option>
            {employees?.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee?.basicField?.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-center mt-2 text-xs">
            <p>{error}</p>
          </div>
        )}
        <div className="flex gap-5">
          <button
            className="w-full py-2 mt-4 rounded-md bg-gradient-to-r from-blue-900 to-deepblue text-white text-sm font-medium"
            onClick={handleTransfer}
          >
            Transfer
          </button>
          <button
            className="w-full py-2 mt-4 rounded-md bg-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-400"
            onClick={onClose}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
