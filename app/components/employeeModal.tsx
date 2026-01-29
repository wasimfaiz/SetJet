import axios from "axios";
import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

interface EmployeeListModalProps {
  show: boolean;
  onClose: () => void;
  handleEmployee: (param1: any, param2: any, permissions?: string[]) => void;
}

const EmployeeListModal: React.FC<EmployeeListModalProps> = ({
  show,
  onClose,
  handleEmployee,
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({
    edit: false,
    delete: false,
  });

  const [isPermissionsStep, setIsPermissionsStep] = useState(false);
  const hasPermissions = handleEmployee.length === 3;

  useEffect(() => {
    if (show) {
      const fetchEmployees = async () => {
        try {
          const response = await apiClient.get("/api/employees?status=ACTIVE");
          setEmployees(response.data);
          setLoading(false);
        } catch (error: any) {
          console.error("Failed to fetch employees:", error);
          setLoading(false);
        }
      };
      fetchEmployees();
    }
  }, [show]);

  const handleCheckboxChange = (permission: string) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleEmployeeSelection = (employee: any) => {
    setSelectedEmployee(employee);
  };

  const handleContinue = () => {
    if (selectedEmployee) {
      setIsPermissionsStep(true);
    }
  };

  const handleSubmit = () => {
    if (selectedEmployee) {
      const selectedPermissions = Object.keys(permissions).filter(
        (key) => permissions[key]
      );
      handleEmployee(
        selectedEmployee._id,
        selectedEmployee.basicField?.name,
        selectedPermissions
      );
      onClose();
    }
  };

  const handleBack = () => {
    setIsPermissionsStep(false);
    setSelectedEmployee(null);
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = emp?.basicField?.name?.toLowerCase() || "";
    const email = emp?.basicField?.email?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase())
    );
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-r from-green-900 to-parrotgreen rounded-lg p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-lg text-center mb-4 text-white">
          {isPermissionsStep
            ? `Assign Permissions to ${selectedEmployee?.basicField?.name}`
            : "Select an Employee"}
        </h2>

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : isPermissionsStep && hasPermissions ? (
          <div>
            <div className="mt-4 bg-white rounded-lg p-5">
              {Object.keys(permissions).map((permission) => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={permission}
                    checked={permissions[permission]}
                    onChange={() => handleCheckboxChange(permission)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={permission}
                    className="text-gray-700 capitalize"
                  >
                    {permission}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="py-2 px-4 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-gradient-to-r from-blue-900 to-deepblue text-white font-medium hover:bg-blue-600"
                onClick={handleSubmit}
              >
                Save Permissions
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* 🔍 Search input */}
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full mb-3 p-2 rounded-lg border border-gray-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="max-h-80 overflow-y-auto border rounded-lg p-4 bg-white">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    key={employee._id}
                    className={`w-full text-left py-2 px-4 rounded-lg text-gray-700 font-medium focus:outline-none transition-all duration-200 ${
                      selectedEmployee?._id === employee._id
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleEmployeeSelection(employee)}
                  >
                    {employee?.basicField?.name} -{" "}
                    {employee?.basicField?.email}
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500">No results found</div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="py-2 px-4 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                  selectedEmployee
                    ? "bg-gradient-to-r from-blue-900 to-deepblue hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                onClick={hasPermissions ? handleContinue : handleSubmit}
                disabled={!selectedEmployee}
              >
                {hasPermissions ? "Continue" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeListModal;
