import React from "react";

interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  onClose,
  onDelete,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-80">
        <h2 className="text-lg font-semibold text-center mb-4">
          Are you sure you want to delete this?
        </h2>
        <div className="flex justify-between">
          <button
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            className="bg-indigo-900 text-white py-2 px-4 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
