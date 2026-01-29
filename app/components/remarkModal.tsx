import React, { useState, useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { formatDateTime } from "../utils/helperFunc";

interface RemarkModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (remarks: string[], remarkUpdatedAt: string[]) => void;
  initialValues?: string[] | null;
  initialDates?: string[] | null;
}

const RemarkModal: React.FC<RemarkModalProps> = ({
  show,
  onClose,
  onSave,
  initialValues = [],
  initialDates = [],
}) => {
  if (!show) return null;

  // State variables for remarks and their update timestamps.
  const [remarks, setRemarks] = useState<string[]>([]);
  const [remarkUpdatedAt, setRemarkUpdatedAt] = useState<string[]>([]);
  const [remark, setRemark] = useState("");

  // A ref to avoid resetting state repeatedly while the modal is open.
  const initialized = useRef(false);

  // Reset state when modal opens (only once per open).
  useEffect(() => {
    if (show && !initialized.current) {
      // Compute clean initial values from props
      const cleanInitialValues = Array.isArray(initialValues)
        ? initialValues.filter(Boolean)
        : [];
      
      let updatedDates = initialDates && initialDates.length
        ? [...initialDates]
        : new Array(cleanInitialValues.length).fill("");

      while (updatedDates.length < cleanInitialValues.length) {
        updatedDates.push("");
      }

      setRemarks(cleanInitialValues);
      setRemarkUpdatedAt(updatedDates);
      initialized.current = true;
    }
    if (!show) {
      // Reset the flag when modal closes so that next open will reinitialize
      initialized.current = false;
    }
  }, [initialValues, initialDates, show]);

  // Function to get the current timestamp in IST.
  const getCurrentISTTime = () => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString();
  };

  // Handle editing a remark.
  const handleEdit = (index: number, newValue: string) => {
    setRemarks((prev) => {
      const updated = [...prev];
      updated[index] = newValue;
      return updated;
    });
    setRemarkUpdatedAt((prev) => {
      const updatedDates = [...prev];
      updatedDates[index] = getCurrentISTTime();
      return updatedDates;
    });
  };

  // Handle deleting a remark.
  const handleDelete = (index: number) => {
    setRemarks((prev) => prev.filter((_, i) => i !== index));
    setRemarkUpdatedAt((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle adding a new remark.
  const handleAddAnother = () => {
    setRemarks((prev) => ["", ...prev]);
    setRemarkUpdatedAt((prev) => ["", ...prev]);
  };

  // Handle saving remarks.
  const handleSave = () => {
    let finalRemarks = remarks;
    let finalDates = remarkUpdatedAt;

    if (remarks.length === 0 && remark.trim() !== "") {
      finalRemarks = [remark.trim()];
      finalDates = [getCurrentISTTime()];
    }

    onSave([...finalRemarks], [...finalDates]);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 h-80 overflow-y-auto mx-2">
        <h2 className="text-lg font-semibold text-center mb-4 text-gray-800">
          Remark
        </h2>
        <Formik
          initialValues={{ name: "" }}
          validationSchema={Yup.object({
            name: Yup.string().required("Remark is required"),
          })}
          onSubmit={(values, { resetForm }) => {
            if (!values.name.trim()) return;
            const newRemark = values.name.trim();
            const newDateStr = getCurrentISTTime();
            setRemarks((prev) => [newRemark, ...prev]);
            setRemarkUpdatedAt((prev) => [newDateStr, ...prev]);
            resetForm();
          }}
        >
          {() => (
            <Form>
              {remarks.length > 0 ? (
                <ul className="mb-4 overflow-y-auto">
                  {remarks.map((rem, index) => (
                    <li key={index} className="flex items-center justify-between border-b py-2">
                      <div className="flex flex-col flex-grow">
                        <textarea
                          rows={4}
                          value={rem}
                          onChange={(e) => handleEdit(index, e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1 focus:ring focus:ring-deepblue focus:outline-none"
                        />
                        <span className="text-xs text-gray-500 ml-2">
                          {remarkUpdatedAt[index] ? formatDateTime(remarkUpdatedAt[index]) : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 ml-2"
                        onClick={() => handleDelete(index)}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col mb-4">
                  <label className="text-sm font-semibold text-deepblue">Remark</label>
                  <textarea
                    rows={4}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Remark"
                    className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col space-y-2">
                {remarks.length > 0 && (
                  <button
                    type="button"
                    className="underline text-blue-600 text-sm"
                    onClick={handleAddAnother}
                  >
                    + Add Another Remark
                  </button>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  className="bg-indigo-900 text-white py-2 px-4 rounded-lg"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default RemarkModal;
