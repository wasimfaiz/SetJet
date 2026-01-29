"use client";
import { usePermissions } from "@/app/contexts/permissionContext";
import { faDownload, faTrashCan, faTimesCircle, faMessage, faEye, faBackward, faArrowRotateBack } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import Pagination from "../../components/pagination";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";  // Import DatePicker CSS
import apiClient from "../../utils/apiClient";
import axios from "axios";
import Loader from "../../components/loader";
import Table from "@/app/components/table";
import RefundModal from "@/app/components/refundModal";

const columns = [
  { header: "Bill to", accessor: "to", type: "text" },
  { header: "Mobile", accessor: "mobile", type: "text" },
  { header: "Date", accessor: "date", type: "text" },
  { header: "Invoice no.", accessor: "invoiceNumber", type: "text" },
  { header: "Download At", accessor: "pdfDownloadedAt", type: "dateTime" },
  { header: "Total Amount", accessor: "totalAmount", type: "number" },
  { header: "Paid Amount", accessor: "paidAmount", type: "number" },
  { header: "Balance Amount", accessor: "balanceAmount", type: "number" },
  { header: "Refund Amount", accessor: "refundTotal"}
];

const InvoiceContentPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]); // State for date range
  const [startDate, endDate] = dateRange;
  const [isModalOpen, setModalOpen] = useState(false);

  const [invoiceForFilter, setInvoiceForFilter] = useState<string>("");
  const [countryApplyingForFilter, setCountryApplyingForFilter] = useState<string>("");
  const [refundFilter, setRefundFilter] = useState<string>("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState("");
  const lookingForOptions = [
    "",
    "BACHELORS",
    "MASTERS",
    "MBA",
    "MBBS",
    "MEDICAL",
    "SPOKEN ENGLISH",
    "IELTS COURSE",
    "TESTAS COURSE",
    "GERMAN LANGUAGE COURSE",
    "WORKING VISA",
    "REGISTRATION",
    "OTHERS",
  ];

  const CountryApplyingfor = [
    "",
    "INDIA",
    "USA",
    "CANADA",
    "UK",
    "FINLAND",
    "MALTA",
    "LUXEMBOURG",
    "CHINA",
    "NEPAL",
    "BANGLADESH",
    "NEW ZEALAND",
    "SINGAPORE",
    "SWEDEN",
    "GERMANY",
    "GEORGIA",
    "AUSTRIA",
    "RUSSIA",
    "ITALY",
  ];

  const refundOptions=["","REFUNDED", "NOT REFUNDED"]
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      let apiUrl = `/api/invoice?page=${currentPage}&limit=${pageLimit}`;
      if (searchQuery) {
        apiUrl += `&search=${searchQuery}`;
      }

      // Conditionally add dateRange as a JSON string
      if (startDate && endDate) {
        const dateRangeObj = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        apiUrl += `&dateRange=${JSON.stringify(dateRangeObj)}`;
      }

      if (invoiceForFilter) {
        apiUrl += `&invoiceFor=${invoiceForFilter}`;
      }
      if (countryApplyingForFilter) {
        apiUrl += `&countryApplyingFor=${countryApplyingForFilter}`;
      }
      if (refundFilter) {
        apiUrl += `&refund=${refundFilter}`;
      }
      const response = await apiClient.get(apiUrl);
      if (response.data && Array.isArray(response.data.invoices)) {

        // Calculate totals for each invoice
        const processedInvoices = response.data.invoices.map((invoice: any) => {
          let paidAmount = 0;
          let balanceAmount = 0;
          let totalAmount = 0; // Initialize totalAmount

          if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach((item: any) => {
              const packageAmount = Number(item.packageamount) || 0;
              const gstPercentage = Number(item.gst) || 0;
              const gstAmount = (packageAmount * gstPercentage) / 100;
              const itemTotalAmount = packageAmount + gstAmount;
              const itemPaidAmount = Number(item.paidamount) || 0;
              const itemBalanceAmount = itemTotalAmount - itemPaidAmount;

              paidAmount += itemPaidAmount;
              balanceAmount += itemBalanceAmount;
              totalAmount += itemTotalAmount; // Accumulate totalAmount
            });
          }
          return {
            ...invoice,
            totalAmount: totalAmount.toFixed(2), // Add totalAmount to the invoice
            paidAmount: paidAmount.toFixed(2),
            balanceAmount: balanceAmount.toFixed(2),
          };
        });

        setInvoices(processedInvoices);

      } else {
        console.warn("Unexpected data format from API:", response.data);
        setInvoices([]);
      }
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError("Failed to load invoices.");
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageLimit, searchQuery, startDate, endDate, invoiceForFilter, countryApplyingForFilter, refundFilter]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      let apiUrl=`/api/invoice/summary?countryApplyingFor=${countryApplyingForFilter}&invoiceFor=${invoiceForFilter}&search=${searchQuery}`;
      if (startDate && endDate) {
        const dateRangeObj = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        apiUrl += `&dateRange=${JSON.stringify(dateRangeObj)}`;
      }
      const response = await apiClient.get(apiUrl);
      setSummary(response.data)
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchInvoices, searchQuery, startDate, endDate, invoiceForFilter, countryApplyingForFilter, refundFilter]);

  useEffect(() => {
    fetchSummary()
  }, [searchQuery, startDate, endDate, invoiceForFilter, countryApplyingForFilter, refundFilter]);
  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/invoice?id=${selectedItem._id}`);
        setInvoices((prevInvoices) =>
          prevInvoices.filter((invoice) => invoice._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (err) {
        setError("Failed to delete invoice.");
      }
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

  const handlePdf = async (item: any) => {
    setIsGeneratingPDF(true);
    setUserError(null);
    setSelectedItem(item);

    if (selectedItem) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);

      try {
        const response = await apiClient.get(`/api/invoice?id=${item?._id}`);
        const invoice = response.data;

        const res = await fetch("/api/invoice/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: JSON.stringify(invoice) }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "invoice.pdf";
          link.click();
          const file = new File([blob], "invoice.pdf", { type: blob.type });

          // now you can call your existing upload helper
          await handleFileUpload(
            file,
            "invoice.pdf",        // this becomes file.name in your helper
            (field, url) => { /* … whatever you do with the returned URL … */ },
            "whatsappLinks"       // or whichever S3 folder you want
          );
          // Update the `pdfDownloadedAt` property in the database
          await apiClient.put(`/api/invoice?id=${item?._id}`, {
            pdfDownloadedAt: createdAt,
            date: createdAt // Also update the main 'date' field to be the download date
          });
        } else {
          setUserError("Failed to generate PDF.");
        }
      } catch (err) {
        setUserError("An error occurred while generating the PDF.");
      } finally {
        setIsGeneratingPDF(false);
        await fetchInvoices(); // Refetch to reflect the updated date

      }
    }
  };

  const handleSearch = (searchString: string) => {
    setSearchQuery(searchString);
    changePage(1);
  };

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    changePage(1); // Reset to page 1 after date change
  };

  const handleInvoiceForChange = (filterString: string) => {
    setInvoiceForFilter(filterString);
    changePage(1);
  };

  const handleCountryApplyingForChange = (filterString: string) => {
    setCountryApplyingForFilter(filterString);
    changePage(1);
  };
  const handleRefundFilter = (filterString: string) => {
    setRefundFilter(filterString);
    changePage(1);
  };
  const handleView = (item: any) => {
    router.push(`/leadSystem/invoice/${item._id}`);
  };
  const handleMessage = async (item: any) => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Fetch invoice & generate PDF
      const invoiceRes = await apiClient.get(`/api/invoice?id=${item._id}`);
      const invoice = invoiceRes.data;
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
      const phoneNumber = item.mobile || "";
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
  const handleRefundSubmit = async (data: {
    paymentMode: string;
    refundAmount: number;
    reason: string;
    refundedAt: string;
  }) => {
    if (selectedItem) {
      try {
        // Prepare existing + new refund data
        const previousRefunds = Array.isArray(selectedItem.refundDetails)
          ? selectedItem.refundDetails
          : [];

        const updatedRefundDetails = [...previousRefunds, data];

        const refundTotal = updatedRefundDetails.reduce(
          (sum, item) => sum + (item.refundAmount || 0),
          0
        );

        // Send to backend
        await apiClient.put(`/api/invoice?id=${selectedItem._id}`, {
          refundDetails: updatedRefundDetails,
          refundTotal,
        });

        // Update local state if needed
        setInvoices((prevInvoices) =>
          prevInvoices.map((invoice) =>
            invoice._id === selectedItem._id
              ? {
                  ...invoice,
                  refundStatus: "processed",
                  refundDetails: updatedRefundDetails,
                  refundTotal,
                }
              : invoice
          )
        );

        setModalOpen(false);
      } catch (err) {
        console.error(err);
        setError("Failed to process refund.");
      }
    }
  };

  const clearInvoiceForFilter = () => {
    setInvoiceForFilter("");
    changePage(1);
  };

  const clearCountryApplyingForFilter = () => {
    setCountryApplyingForFilter("");
    changePage(1);
  };
  const clearRefundFilter = () => {
    setRefundFilter("");
    changePage(1);
  };
  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const openRefundModal = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const renderActions = (item: any) => (
    <>
      <button title="Refund" className="h-5 w-5 text-deepblue" onClick={() => openRefundModal(item)}>
        <FontAwesomeIcon icon={faArrowRotateBack} />
      </button>
      <button title="View" className="h-5 w-5 text-deepblue" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      <button title="Download" className="h-5 w-5 text-deepblue" onClick={() => handlePdf(item)}>
        <FontAwesomeIcon icon={faDownload} />
      </button>
      <button
        title="Text"
        className="h-5 w-5 text-green-300"
        onClick={() => handleMessage(item)}
      >
        <FontAwesomeIcon icon={faMessage} />
      </button>
      {checkButtonVisibility(permissions, "invoice", "delete") && (
        <button
          title="Delete"
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  const handlePageChange = (page: number) => {
    changePage(page);
  };

  const handlePageLimitChange = (limit: number) => {
    setPageLimit(limit);
    changePage(1);
  };
  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="invoice">
      <div className="relative mt-16 mb-8 w-[80%] mx-auto px-4">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="text-3xl text-deepblue">Invoices</div>
          <div className="flex items-center w-full justify-end pr-4">
            {checkButtonVisibility(permissions, "invoice", "add") && (
              <Link
                href={`/leadSystem/invoice/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Invoice
              </Link>
            )}
          </div>
        </div>
        <div className="flex justify-between gap-4 mt-6">
          <div className="flex-1 bg-white shadow-md rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            {/* @ts-ignore */}
            <p className="text-xl font-semibold text-blue-600">₹{summary?.totalAmount}</p>
          </div>
          <div className="flex-1 bg-white shadow-md rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Paid Amount</p>
            {/* @ts-ignore */}
            <p className="text-xl font-semibold text-green-600">₹{summary?.paidAmount}</p>
          </div>
          <div className="flex-1 bg-white shadow-md rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Balance Amount</p>
            {/* @ts-ignore */}
            <p className="text-xl font-semibold text-red-600">₹{summary?.balanceAmount}</p>
          </div>
          <div className="flex-1 bg-white shadow-md rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Refund Amount</p>
            {/* @ts-ignore */}
            <p className="text-xl font-semibold text-orange-600">₹{summary?.refundAmount}</p>
          </div>
        </div>

        <div className="my-4 flex gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email"
            className="border p-2 w-full lg:w-1/4 rounded-lg"
          />

          {/* Date Range Picker */}
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => {
              handleDateRangeChange(update);
            }}
            isClearable={true}
            placeholderText="Select Date Range"
            className="border p-2 w-full lg:w-42 rounded-lg" // Adjust width as needed
          />

          <div className="relative w-full lg:w-1/6">
            <select
              value={invoiceForFilter}
              onChange={(e) => handleInvoiceForChange(e.target.value)}
              className="border p-2 h-11 w-full rounded-lg appearance-none"
            >
              {lookingForOptions.map((option) => (
                <option key={option} value={option}>
                  {option || "Looking For"}
                </option>
              ))}
            </select>
            {invoiceForFilter && (
              <button
                onClick={clearInvoiceForFilter}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>


          <div className="relative w-full lg:w-1/6">
            <select
              value={countryApplyingForFilter}
              onChange={(e) => handleCountryApplyingForChange(e.target.value)}
              className="border p-2 h-11 w-full rounded-lg appearance-none"
            >
              {CountryApplyingfor.map((option) => (
                <option key={option} value={option}>
                  {option || "Country Applying For"}
                </option>
              ))}
            </select>
            {countryApplyingForFilter && (
              <button
                onClick={clearCountryApplyingForFilter}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>
          
          <div className="relative w-full lg:w-1/6">
            <select
              value={refundFilter}
              onChange={(e) => handleRefundFilter(e.target.value)}
              className="border p-2 h-11 w-full rounded-lg appearance-none"
            >
              {refundOptions.map((option) => (
                <option key={option} value={option}>
                  {option || "Refund Status"}
                </option>
              ))}
            </select>
            {refundFilter && (
              <button
                onClick={clearRefundFilter}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>
        </div>

        {userError && <div className="text-red-500 my-4">{userError}</div>}

        <div className="my-10 px-2">
          <Table
            data={invoices}
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            pagination="manual"
            itemsPerPage={pageLimit}
            db={currentPage - 1}

          />
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageLimitChange={handlePageLimitChange}
          pageLimit={pageLimit}
        />
      <RefundModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleRefundSubmit}
      />
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>
  );
};
const InvoicePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceContentPage />
    </Suspense>
  );
};
export default InvoicePage;