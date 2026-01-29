import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    paymentMode: string;
    refundAmount: number;
    reason: string;
    refundedAt: string; // ISO date string
  }) => void;
};

const RefundModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [refundedAt, setRefundedAt] = useState(
    new Date().toISOString().split("T")[0] // default to today's date (yyyy-mm-dd)
  );

    const handleSubmit = () => {
    const parsedAmount = parseFloat(refundAmount);
    if (isNaN(parsedAmount)) {
        alert("Please enter a valid refund amount");
        return;
    }

    onSubmit({
        paymentMode,
        refundAmount: parsedAmount,
        reason,
        refundedAt,
    });
    onClose();
    };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Issue Refund</h2>

        {/* Payment Mode */}
        <label className="block mb-2 font-medium text-gray-700">
          Payment Mode
        </label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="Online">Online</option>
        </select>

        {/* Refund Amount */}
        <label className="block mb-2 font-medium text-gray-700">
          Refund Amount
        </label>
        <input
        type="number"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        value={refundAmount}
        onChange={(e) => setRefundAmount(e.target.value)}
        placeholder="Enter refund amount"
        />
        {/* Reason */}
        <label className="block mb-2 font-medium text-gray-700">
          Reason for Refund
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Refunded At */}
        <label className="block mb-2 font-medium text-gray-700">
          Refunded Date
        </label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          value={refundedAt}
          onChange={(e) => setRefundedAt(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
