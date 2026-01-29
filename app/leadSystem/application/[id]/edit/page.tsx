"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Loader from "@/app/components/loader";
import { uploadS3File } from "@/app/utils/methods";

type Payment = {
  status?: string;
  transactionId?: string;
  amount?: number | "";
  paidAt?: string | null;
  merchantOrderId?: string;
  phonepeOrderId?: string;
  remark?: string;
  attachment?: string;
  serviceId?: string;
};

export default function EditPaymentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userPhone, setUserPhone] = useState<string>("");

  // payment object
  const [payment, setPayment] = useState<Payment>({
    status: "",
    transactionId: "",
    amount: "",
    paidAt: null,
    merchantOrderId: "",
    phonepeOrderId: "",
  });

  // NEW: application-level status (outside payment)
  const [appStatus, setAppStatus] = useState<string>("");
  const [appRemark, setAppRemark] = useState<string>("");
  const [appAttachment, setAppAttachment] = useState<string>("");

  // Helper: convert ISO -> datetime-local value (yyyy-MM-ddTHH:mm)
  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
      return local;
    } catch {
      return "";
    }
  };

  // Helper: convert datetime-local -> ISO
  const localInputToIso = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    return d.toISOString();
  };

  useEffect(() => {
    let mounted = true;
    async function fetchApp() {
      setLoading(true);
      try {
        const res = await axios.get(`/api/application?id=${id}`);
        if (!mounted) return;
        const app = res.data;
        const p = app?.payment ?? {};
        setPayment({
          status: p.status ?? "",
          transactionId: p.transactionId ?? "",
          amount: p.amount ?? "",
          paidAt: p.paidAt ? isoToLocalInput(p.paidAt) : null,
          merchantOrderId: p.merchantOrderId ?? "",
          phonepeOrderId: p.phonepeOrderId ?? "",
          remark: p.remark ?? "",
          attachment: p.attachment ?? "",
          serviceId: app.serviceId ?? "",
        });

        // NEW: set application-level status from app.status
        setAppStatus(app?.status ?? "");
        setAppRemark(app?.remark ?? "");
        setAppAttachment(app?.attachment ?? "");
        
        // Fetch phoneNumber first, fallback to userSnapshot.phone, normalize to E.164
        const phoneFromApp = app.phoneNumber ? String(app.phoneNumber).replace(/\s+/g, "") : "";
        const phoneFromSnapshot = app?.userSnapshot?.phone ? String(app.userSnapshot.phone).replace(/\s+/g, "") : "";
        const finalPhone = phoneFromApp || phoneFromSnapshot || "";
        setUserPhone(finalPhone.startsWith("+") ? finalPhone : `+91${finalPhone}`);
      } catch (err) {
        console.error(err);
        setError("Failed to load application. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) fetchApp();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (field: keyof Payment, value: any) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const validate = (): string | null => {
    // simple validation: payment.status required and amount if provided must be number
    if (!payment.status || payment.status.trim() === "")
      return "Payment status is required.";
    if (
      payment.amount !== "" &&
      payment.amount !== null &&
      isNaN(Number(payment.amount))
    ) {
      return "Amount must be a number.";
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const url = await uploadS3File(file);
      if (!url) throw new Error("File upload failed");

      handleChange("attachment", url);
      setAppAttachment(url);

      // ✅ File uploaded successfully - no SMS needed
      console.log("✅ File uploaded:", url);
      
    } catch (err: any) {
      console.error("Failed to upload:", err);
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    try {
      // Build the payment payload converting paidAt back to ISO if present
      const payload = {
        payment: {
          status: (payment.status ?? "").trim(),
          transactionId: payment.transactionId ?? "",
          amount: payment.amount === "" ? 0 : Number(payment.amount ?? 0),
          paidAt: payment.paidAt ? localInputToIso(payment.paidAt as string) : null,
          merchantOrderId: payment.merchantOrderId ?? "",
          phonepeOrderId: payment.phonepeOrderId ?? "",
        },
        remark: appRemark ?? "",
        attachment: appAttachment ?? "",
        status: appStatus ?? "",
      };
      
      await axios.put(`/api/application?id=${id}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save payment. Try again.");
    } finally {
      setSaving(false);
      router.push("/leadSystem/application");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">✎ Edit Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Only payment details will be updated.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            ← Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700">{error}</div>
        )}

        {/* NEW: Application Status (outside payment) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Status</label>
          <select
            value={appStatus ?? ""}
            onChange={(e) => setAppStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Select application status</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PROCESSED">PROCESSED</option>
          </select>
        </div>

        {/* Status & Amount Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <select
              value={payment.status ?? ""}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Select status</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={payment.amount ?? ""}
              onChange={(e) => handleChange("amount", e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="e.g., 499.00"
            />
          </div>
        </div>

        {/* Transaction IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
            <input
              type="text"
              value={payment.transactionId ?? ""}
              onChange={(e) => handleChange("transactionId", e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="Transaction ID (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Order ID</label>
            <input
              type="text"
              value={payment.merchantOrderId ?? ""}
              onChange={(e) => handleChange("merchantOrderId", e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="Merchant order id"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PhonePe Order ID</label>
            <input
              type="text"
              value={payment.phonepeOrderId ?? ""}
              onChange={(e) => handleChange("phonepeOrderId", e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="PhonePe order id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paid At (local)</label>
            <input
              type="datetime-local"
              value={payment.paidAt ?? ""}
              onChange={(e) => handleChange("paidAt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-xs text-gray-400 mt-1">Use local date & time. Will be converted to ISO UTC automatically.</p>
          </div>
        </div>

        {/* Remark & Uploader */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
            <textarea
              value={appRemark ?? ""}
              onChange={(e) => setAppRemark(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="Any notes or remarks"
              rows={3}
            />
          </div>

          {/* Modern File Upload - Upload only, no SMS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Attachment (Invoice / Screenshot / PDF)
            </label>
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
                uploading 
                  ? "border-blue-400 bg-blue-50" 
                  : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30"
              }`}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <svg 
                className="w-10 h-10 text-gray-400 mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 1115.9 6H16a5 5 0 010 10h-1m-4 4l-4-4m0 0l4-4m-4 4h12"
                />
              </svg>
              <p className="text-sm text-gray-600">
                {uploading ? (
                  <span className="text-blue-500 font-medium">Uploading...</span>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag & drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF (max 10MB)</p>
            </div>
            {appAttachment && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Uploaded file:</p>
                {appAttachment.endsWith(".pdf") ? (
                  <a
                    href={payment.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition"
                  >
                    📄 View PDF
                  </a>
                ) : (
                  <img 
                    src={payment.attachment} 
                    alt="Uploaded file" 
                    className="h-28 rounded-lg border shadow-sm" 
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
              saving ? "bg-deepblue" : "bg-deepblue hover:bg-parrotgreen"
            }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
