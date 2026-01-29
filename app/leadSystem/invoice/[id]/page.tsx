"use client";
import { usePermissions } from "@/app/contexts/permissionContext";
import { faDownload, faEdit, faMessage, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Loader from "@/app/components/loader";
import Link from "next/link";
import { toDate, format, isToday, isPast, isValid } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { isToday as isTodayDateFns } from 'date-fns';  // Import isToday from date-fns
import apiClient from "@/app/utils/apiClient";
import { checkButtonVisibility, formatDateTime } from "@/app/utils/helperFunc";

const InvoiceViewPage = () => {

  const MY_WHATSAPP_NUMBER = "7667896481"; // hard-coded “from” number
  const PREWRITTEN_MESSAGE = `Hello! This is a message from ${MY_WHATSAPP_NUMBER}. How can I help you today?`;
  const router = useRouter();
  const { permissions } = usePermissions();
  const params = useParams();
  const { id } = params; // id from URL params
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [showGstColumn, setShowGstColumn] = useState(true); // State to control GST column visibility
  const [error, setError] = useState<string | null>(null);

  // Function to format date based on whether it's the date from 'date' or not
  const formatDate = (selectedDateString: string, createdAtString: string): string => {
    try {
      if (!selectedDateString) {
        console.log("dateString is empty or null");
        return 'N/A';
      }

      if (!createdAtString) {
        console.log("createdAtString is empty or null");
        return 'N/A';
      }

      const selectedDate = new Date(selectedDateString);
      const createdAt = new Date(createdAtString);

      if (!isValid(selectedDate)) {
        console.warn("Invalid date:", selectedDateString);
        return "Invalid Date";
      }

      if (!isValid(createdAt)) {
        console.warn("Invalid createdAt date:", createdAtString);
        return "Invalid Date";
      }

      const timezone = 'Asia/Kolkata';

      // Check if the selected date is today
      const isSelectedDateToday = isTodayDateFns(selectedDate);

      // Conditionally format with or without time
      const dateFormat = isSelectedDateToday ? 'dd/MM/yyyy hh:mm a' : 'dd/MM/yyyy';

      return formatInTimeZone(isSelectedDateToday ? createdAt : selectedDate, timezone, dateFormat, { timeZone: timezone });

    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Function to format itemDate
  const formatItemDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);

      if (!isValid(date)) {
        console.warn("Invalid itemDate:", dateString);
        return "Invalid Date";
      }

      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error("Error formatting itemDate:", error);
      return "Invalid Date";
    }
  };

  // Fetch the invoice data from the server
  const fetchInvoice = async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/invoice?id=${id}`);
      setSelectedItem(response.data?.invoice);

      // Check if GST is applicable for any item
      let gstApplicable = false;
      if (response.data.items && Array.isArray(response.data.items)) {
        for (const item of response.data.items) {
          if (item.gst && safeParseNumber(item.gst) > 0) {
            gstApplicable = true;
            break;
          }
        }
      }
      setShowGstColumn(gstApplicable); // Set state based on GST applicability
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit functionality
  const handleEdit = () => {
    if (selectedItem && selectedItem._id) {
      router.push(`/leadSystem/invoice/add?id=${id}`);
    }
  };
  // Generate PDF
  const handlePdf = async () => {
    setIsGeneratingPDF(true);
    setUserError(null);
    if (selectedItem) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (IST offset in milliseconds (IST offset in milliseconds (5 hours 30 minutes))
      const createdAt = new Date(now.getTime() + istOffset);
    
    try {
      // Fetch the invoice data
      const response = await apiClient.get(`/api/invoice?id=${selectedItem?._id}`);
      await apiClient.put(`/api/invoice?id=${selectedItem?._id}`, {
        pdfDownloadedAt: createdAt,
       });
      const invoice = response.data?.invoice;

      // Generate PDF by sending the invoice data
      const res = await fetch("/api/invoice/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: JSON.stringify(invoice) }),
      });

      if (res.ok) {
        const blob = await res.blob();

        // Create a download link for the PDF
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "invoice.pdf";
        link.click();
      } else {
        setUserError("Failed to generate PDF.");
      }
    } catch (err) {
      setUserError("An error occurred while generating the PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }
  };
  // Handle print
  const handlePrint = () => {
    // Optional: Focus on the printable section by using CSS
    const printContents = document.getElementById("printable-section")?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents; // Restore the original content
      // window.location.reload(); // Removed reload to prevent flickering. State already updated.
    } else {
      console.error("Printable section not found.");
    }
  };
  const handleFileUpload = async (
    file: File,
    name: string,
    setFieldValue: (f: string, v: any) => void,
    folderNameFromConfig?: string
  ) => {
    setLoading(true);
    const folder = folderNameFromConfig || name.split(".").pop();
    try {
      const { uploadURL, fileURL } = (await apiClient.post(
        "/api/auth/sign_s3",
        { fileName: file.name, fileType: file.type, folderName: folder }
      )).data;
      await fetch(uploadURL, { method: "PUT", body: file });
      setFieldValue(name, fileURL);
    } catch {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };
  const handleMessage = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Fetch invoice & generate PDF
      const invoiceRes = await apiClient.get(`/api/invoice?id=${selectedItem._id}`);
      const invoice = invoiceRes.data?.invoice;
      const genRes = await fetch("/api/invoice/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(invoice) }),
      });
      if (!genRes.ok) throw new Error("PDF generation failed");
      const blob = await genRes.blob();

      // 2️⃣ Create File & upload to S3
      const file = new File([blob], "invoice.pdf", { type: blob.type });
      let uploadedUrl = "";
      await handleFileUpload(
        file,
        file.name,
        (_field, url) => { uploadedUrl = url; },
        "whatsappLinks" // or your preferred folder
      );
      if (!uploadedUrl) throw new Error("Upload failed");

      // 3️⃣ Prepare payload
      const phoneNumber = selectedItem.mobile || "";
      if (!phoneNumber) throw new Error("Invalid phone number");

      // Set transfer timestamp in IST timezone
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);
      const payload = {
        phoneNumber,
        link: uploadedUrl,
        businessId: selectedItem?._id,
        timestamp: createdAt,
      };

      // 4️⃣ Send via your API
      await apiClient.post("/api/send-message", payload);

      alert("Message sent successfully!");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Could not send message.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchInvoice(id); // Ensure the id is a string
    }
  }, [id]);

  if (loading || isGeneratingPDF) {
    return <Loader />;
  }

  if (!selectedItem) {
    return <div>Invoice not found.</div>;
  }

  // Function to safely parse numbers, returning 0 if parsing fails
  const safeParseNumber = (value: any): number => {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate the values with safe parsing
  const calculateInvoiceTotals = () => {
    let paidAmountTotal = 0;
    let balanceAmountTotal = 0;

    if (selectedItem.items && Array.isArray(selectedItem.items)) {
      for (const item of selectedItem.items) {
        const packageAmount = safeParseNumber(item.packageamount);
        const gstPercentage = safeParseNumber(item.gst);
        const gstAmount = (packageAmount * gstPercentage) / 100;
        const totalAmount = packageAmount + gstAmount;
        const paidAmount = safeParseNumber(item.paidamount);
        const balanceAmount = totalAmount - paidAmount;

        paidAmountTotal += paidAmount;
        balanceAmountTotal += balanceAmount;
      }
    }

    return {
      paidAmountTotal,
      balanceAmountTotal,
    };
  };

  const { paidAmountTotal, balanceAmountTotal } = calculateInvoiceTotals();
  if (loading ) return <Loader />;

  return (
    <div className="container invoice-container p-5 my-10">
      <div className="flex justify-between mb-4">
        <Link
          className="text-blue-500 underline hover:text-deepblue cursor-pointer"
          href={"/leadSystem/invoice"}
        >
          Back
        </Link>
        <div className="flex gap-5 items-center">
          {checkButtonVisibility(permissions, "invoice", "add") && (
            <Link
              href={`/leadSystem/invoice/add`}
              className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
            >
              + Add Invoice
            </Link>
          )}
          {checkButtonVisibility(permissions, "edit", "delete") && (
          <button
            className="text-blue-500 hover:text-deepblue cursor-pointer"
            onClick={handleEdit}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>)}
          <button
            className="text-blue-500 hover:text-deepblue cursor-pointer"
            onClick={handlePdf}
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button
            title="Text"
            className="h-5 w-5 text-green-300"
            onClick={handleMessage}
          >
            <FontAwesomeIcon icon={faMessage} />
          </button>
          <button
            className="text-blue-500 hover:text-deepblue cursor-pointer"
            onClick={handlePrint}
          >
            <FontAwesomeIcon icon={faPrint} />
          </button>
        </div>
      </div>

      <div id="printable-section" className="relative my-5">
        <div className="flex justify-between items-center border-b-2 border-gray-300 pb-4">
          <div className="flex items-center justify-center w-full">
            <img src="/logo.png" alt="Logo" className="h-8 mr-2" />
            <h1 className="text-2xl font-bold text-deepblue">
              EUROPASS IMMIGRATION PRIVATE LIMITED
            </h1>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-deepblue">Invoice</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm text-gray-800">
          <div>
            <p>
              <span className="font-bold">Bill to:</span> {selectedItem.to}
            </p>
            <p>
              <span className="font-bold">Mobile Number:</span> {selectedItem.mobile}
            </p>
            <p>
              <span className="font-bold">Date:</span> {selectedItem.date ? formatDate(selectedItem.date, selectedItem.createdAt) : 'N/A'}
            </p>
            <p>
              <span className="font-bold">Invoice No:</span>{" "}
              {selectedItem.invoiceNumber}
            </p>
            {selectedItem.gstNumber && selectedItem.gstNumber !== "0" && selectedItem.gstNumber !== "" && showGstColumn && (
              <p>
                <span className="font-bold">GST No.:</span>{" "}
                {selectedItem.gstNumber}
              </p>
            )}
             <p>
              <span className="font-bold">Invoice For:</span>{" "}
              {selectedItem.invoiceFor}
            </p>
            <p>
              <span className="font-bold">Country Applying For:</span>{" "}
              {selectedItem.countryApplyingFor}
            </p>

            <p>
              <span className="font-bold">Course Applying For:</span>{" "}
              {selectedItem.courseApplyingFor}
            </p>
            <p>
              <span className="font-bold">Sales Employee:</span>{" "}
              {selectedItem?.salesEmployee}
            </p>
            <p>
              <span className="font-bold">Created By:</span>{" "}
              {selectedItem.by?.employeeName}
            </p>
            {/* <p>
              <span className="font-bold">Payment Mode:</span>{" "}
              {selectedItem.paymentMode}
            </p> */}
          </div>
          <div className="text-right">
            <p className="font-bold">From,</p>
            <p>{selectedItem.from}</p>
            <p>{selectedItem.address}</p>
          </div>
        </div>

        <table className="w-full text-sm text-left text-gray-600 border-collapse border border-gray-200 mb-4">
          <thead>
            <tr className="bg-deepblue text-white">
              <th className="border border-gray-300 px-4 py-2">Date</th>  {/* Item Date */}
              <th className="border border-gray-300 px-4 py-2">Description</th>
              <th className="border border-gray-300 px-4 py-2">Package Amount</th>
              <th className="border border-gray-300 px-4 py-2">Payment Mode</th>
              {showGstColumn && (
                <th className="border border-gray-300 px-4 py-2">GST %</th>
              )}
              <th className="border border-gray-300 px-4 py-2">Total Amount</th>
              <th className="border border-gray-300 px-4 py-2">Paid Amount</th>
              <th className="border border-gray-300 px-4 py-2">
                Balance Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedItem.items && Array.isArray(selectedItem.items) ? selectedItem.items.map((item: any, index: number) => {
              const packageAmount = safeParseNumber(item.packageamount);
              const gstPercentage = safeParseNumber(item.gst);
              const gstAmount = (packageAmount * gstPercentage) / 100;
              const totalAmount = packageAmount + gstAmount;
              const paidAmount = safeParseNumber(item.paidamount);
              const balanceAmount = totalAmount - paidAmount;

              return (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{formatItemDate(item.itemDate)}</td>  {/* Display Item Date */}
                  <td className="border border-gray-300 px-4 py-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {packageAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.paymentMode}
                  </td>
                  {showGstColumn && (
                    <td className="border border-gray-300 px-4 py-2">
                      {gstPercentage ? `${gstPercentage} %` : "NA"}
                    </td>
                  )}
                  <td className="border border-gray-300 px-4 py-2">
                    {totalAmount.toFixed(2)}/-
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {paidAmount.toFixed(2)}/-
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {balanceAmount.toFixed(2)}/-
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={showGstColumn ? 7 : 6}>No items found</td></tr>}
          </tbody>
        </table>

        <div className="mt-4 text-sm">
          <div className="border-t border-gray-300 pt-4">
            {/* Paid Amount */}
            <p className="text-right text-deepblue font-bold">
              Paid Amount: {paidAmountTotal.toFixed(2)} /-
            </p>
            {/* Balance Amount */}
            <p className="text-right text-deepblue font-bold">
              Balance Amount: {balanceAmountTotal.toFixed(2)} /-
            </p>
            {Array.isArray(selectedItem?.refundDetails) && selectedItem.refundDetails.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-right text-deepblue font-bold">Refund History:</h3>
                {/* @ts-ignore */}
                {selectedItem.refundDetails.map((refund, index) => (
                  <p key={index} className="text-right text-sm text-gray-700">
                    ₹{Number(refund.refundAmount).toFixed(2)} /- &nbsp;|&nbsp;
                    {refund.paymentMode} &nbsp;|&nbsp;
                    {formatDateTime(refund.refundedAt)} &nbsp;|&nbsp;
                    {refund.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="font-bold">Thank you!</p>
            <div className="mt-2">
              <p className="font-bold">Payment Information:</p>
              <p>
                <span className="font-bold">Name:</span> {selectedItem.from}
              </p>
              <p>
                <span className="font-bold">Bank:</span> {selectedItem.bank}
              </p>
              <p>
                <span className="font-bold">A/c No:</span> {selectedItem.accNo}
              </p>
              <p>
                <span className="font-bold">IFSC:</span> {selectedItem.ifsc}
              </p>
              <p>
                <span className="font-bold">UPI Payment:</span>{" "}
                {selectedItem.upi}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="mt-10 border-t border-gray-300 pt-4 text-sm text-gray-600 flex justify-center items-center gap-8">
        <p className="font-bold text-deepblue">www.yastudy.com</p>
        <p className="font-bold text-deepblue">Phone: +91 7667896481</p>
        <p className="font-bold text-deepblue">Email: support@yastudy.com</p>
      </footer>
    </div>
  );
};

export default InvoiceViewPage;