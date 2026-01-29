import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

interface MultiEmployeeListModalProps {
  show: boolean;
  onClose: () => void;
  enablePermissions?: boolean;
  selectedInitial?: { id: string; name: string; permissions?: string[] }[];
  handleEmployees: (
    selected: { id: string; name: string; permissions?: string[] }[]
  ) => void;
}

const MultiEmployeeListModal: React.FC<MultiEmployeeListModalProps> = ({
  show,
  onClose,
  enablePermissions = false,
  selectedInitial = [],
  handleEmployees,
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [step, setStep] = useState(1);

  const [selectedEmployees, setSelectedEmployees] = useState<{
    [id: string]: string;
  }>({});

  const [permissionsMap, setPermissionsMap] = useState<{
    [id: string]: { [permission: string]: boolean };
  }>({});

  // Load employees and setup initial values for edit mode
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

      // Pre-select from `selectedInitial`
      if (selectedInitial?.length) {
        const initialSelected: { [id: string]: string } = {};
        const initialPermissions: {
          [id: string]: { [permission: string]: boolean };
        } = {};

        selectedInitial.forEach(({ id, name, permissions = [] }) => {
          initialSelected[id] = name;
          initialPermissions[id] = {
            edit: permissions.includes("edit"),
            delete: permissions.includes("delete"),
          };
        });

        setSelectedEmployees(initialSelected);
        setPermissionsMap(initialPermissions);
        if (enablePermissions) setStep(2);
      }
    }
  }, [show]);

  const toggleEmployeeSelection = (id: string, name: string) => {
    setSelectedEmployees((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id];
      } else {
        updated[id] = name;
      }
      return updated;
    });
  };

  const handlePermissionChange = (
    empId: string,
    permission: string,
    value: boolean
  ) => {
    setPermissionsMap((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [permission]: value,
      },
    }));
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleSubmit = () => {
    const final = Object.keys(selectedEmployees).map((id) => ({
      id,
      name: selectedEmployees[id],
      permissions: enablePermissions
        ? Object.entries(permissionsMap[id] || {})
            .filter(([, val]) => val)
            .map(([key]) => key)
        : undefined,
    }));
    handleEmployees(final);
    onClose();
    setStep(1);
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
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-2">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {step === 1
            ? "Select Employees"
            : "Assign Permissions (Optional)"}
        </h2>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : step === 1 ? (
          <>
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full mb-3 p-2 border rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="max-h-72 overflow-y-auto space-y-1 border rounded-lg p-3">
              {filteredEmployees.map((emp) => {
                const id = emp._id;
                const name = emp.basicField?.name || "Unnamed";
                const isSelected = selectedEmployees[id];
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => toggleEmployeeSelection(id, name)}
                      />
                      <span>{name}</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {emp.basicField?.email}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={enablePermissions ? handleContinue : handleSubmit}
                className={`px-4 py-2 rounded text-white ${
                  Object.keys(selectedEmployees).length
                    ? "bg-blue-700 hover:bg-blue-800"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={Object.keys(selectedEmployees).length === 0}
              >
                {enablePermissions ? "Continue" : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 max-h-72 overflow-y-auto border p-4 rounded-lg">
              {Object.entries(selectedEmployees).map(([id, name]) => (
                <div key={id}>
                  <h4 className="font-medium mb-1">{name}</h4>
                  <div className="space-x-4">
                    {["edit", "delete"].map((perm) => (
                      <label key={perm} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={permissionsMap[id]?.[perm] || false}
                          onChange={(e) =>
                            handlePermissionChange(
                              id,
                              perm,
                              e.target.checked
                            )
                          }
                          className="mr-1"
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800"
              >
                Save Permissions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiEmployeeListModal;
