"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import { faArrowLeft, faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FeeView() {
  const { id } = useParams();
  const router = useRouter();
  const [fee, setFee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/api/fees?id=${id}`)
      .then((r) => setFee(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!fee) return <p className="p-6">Not found.</p>;

  const formattedPaymentDate = new Date(fee.paymentDate).toLocaleDateString();

  return (
    <div className="container px-6 py-8 bg-white rounded-2xl shadow-lg">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back
        </button>
        <button
          onClick={() => router.push(`/coachingSystem/fee/add?id=${id}`)}
          className="flex items-center px-4 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Edit
        </button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📄 Fee Details</h1>

      {/* Details */}
      <div className="bg-white p-5 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-gray-700">
        <Detail label="Student" value={fee.student?.name} />
        <Detail label="Batch" value={fee.batch?.name} />
        <Detail label="Slot" value={`${fee.slot?.day} @ ${fee.slot?.time}`} />
        <Detail label="Month Paid" value={fee.monthPaid?.month} />
        <Detail label="Payment Date" value={formattedPaymentDate} />
        <Detail label="Remark" value={fee.remark || "—"} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
