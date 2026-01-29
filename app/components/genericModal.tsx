/* eslint-disable @next/next/no-img-element */
import React from "react";

type ModalProps = {
  title: string;
  description: string;
  onClose: () => void;
};

const Modal: React.FC<ModalProps> = ({ title, description, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition text-3xl"
          >
            &times;
          </button>
        </div>
        {/* Scrollable content area */}
        <div
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(80vh - 120px)" }} // Adjust 120px if header/footer sizes change
        >
          <p className="text-gray-700">{description}</p>
        </div>
        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="text-white px-4 py-2 rounded-lg bg-gradient-to-r from-blue-900 to-deepblue"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
