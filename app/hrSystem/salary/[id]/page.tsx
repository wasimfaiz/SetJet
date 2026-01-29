"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/app/utils/apiClient";
import Loader from "@/app/components/loader";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEdit, faPrint } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const SalarySlipPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [salary, setSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalarySlip = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/salary?id=${id}`);
        setSalary(response.data);
      } catch (error) {
        console.error("Error fetching salary slip:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalarySlip();
  }, [id]);

  // Helper: Determine which month the salary is FOR based on payment date (salaryDate)
  const getSalaryMonthYear = () => {
    if (!salary?.salaryDate) return { display: "N/A", year: 0, monthIndex: 0, daysInMonth: 0 };

    const paymentDate = new Date(salary.salaryDate);
    const paymentDay = paymentDate.getDate();

    let targetDate = paymentDate;
    if (paymentDay <= 30) {
      // Paid early in month → salary for previous month
      targetDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() - 1);
    }

    const monthName = targetDate.toLocaleString("default", { month: "long" });
    const year = targetDate.getFullYear();
    const daysInMonth = new Date(year, targetDate.getMonth() + 1, 0).getDate();

    return {
      display: `${monthName} ${year}`,
      year,
      monthIndex: targetDate.getMonth(),
      daysInMonth,
    };
  };

  const salaryMonthInfo = getSalaryMonthYear();

  // Handle edit
  const handleEdit = () => {
    if (salary?._id) {
      router.push(`/hrSystem/salary/add?id=${salary._id}`);
    }
  };

  // Generate & Download PDF
  const handlePdf = async () => {
    if (!salary) return;
    setIsGeneratingPDF(true);
    setUserError(null);

    try {
// Check for mandatory fields
      const mandatoryFields = [
        "employeeId", "employeeName", "gender", "dob", "doj",
        "designation", "department", "location",
        "bankName", "bankAccountNumber", "ifsc", "pan",
      ];

      const missingFields = mandatoryFields.filter((field: string) => !salary[field]);
      if (missingFields.length > 0) {
        setUserError(`The following fields are mandatory: ${missingFields.join(", ")}`);
        setIsGeneratingPDF(false);
        return;
      }

      // Generate PDF by sending the salary data
      const res = await fetch("/api/salary/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(salary) }),
      });

      if (res.ok) {
        const blob = await res.blob();
  
        // Create a download link for the PDF
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Salary_Slip_${salary.employeeName.replace(/\s+/g, "_")}_${salaryMonthInfo.display}.pdf`;
        link.click();
         // const now = new Date();
        // const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // Convert to UTC
        // const istOffset = 5.5 * 60 * 60 * 1000; // IST Offset in milliseconds
        // const istTime = new Date(utcTime + istOffset);

        const istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        await apiClient.put(`/api/salary?id=${salary._id}`, { pdfDownloadedAt: istTime });
      } else {
        setUserError("Failed to generate PDF.");
      }
    } catch (err) {
      setUserError("An error occurred while generating the PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print
  const handlePrint = () => {
// Optional: Focus on the printable section by using CSS
    const printContents = document.getElementById("printable-section")?.innerHTML;
    if (!printContents) {
      console.error("Printable section not found.");
      return;
    }
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;// Restore the original content
    window.location.reload();// Reload to reset the page state
  };

  // WhatsApp Share
  const handleFileUpload = async (
    file: File,
    name: string,
    setFieldValue: (f: string, v: any) => void,
    folderNameFromConfig?: string
  ) => {
    setLoading(true);
    const folder = folderNameFromConfig || name.split(".").pop();
    try {
      const { uploadURL, fileURL } = (await apiClient.post("/api/auth/sign_s3", {
        fileName: file.name,
        fileType: file.type,
        folderName: folder,
      })).data;
      await fetch(uploadURL, { method: "PUT", body: file });
      setFieldValue(name, fileURL);
      return fileURL;
    } catch {
      alert("Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsapp = async () => {
    if (!salary) return;
    setLoading(true);
    setError(null);

    try {
 // 1️⃣ Fetch the salary & generate PDF
      const genRes = await fetch("/api/salary/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(salary) }),
      });

      if (!genRes.ok) throw new Error("PDF generation failed");
      const blob = await genRes.blob();

    // 2️⃣ Create a File from Blob
      const file = new File([blob], "salary.pdf", { type: blob.type });

    // 3️⃣ Upload to S3 and get the uploaded URL directly (not via setState)
      let uploadedUrl = "";
      await handleFileUpload(
        file,
        file.name,
        (_f, url) => { uploadedUrl = url; },// ← use a local variable
        "whatsappLinks"
      );

      if (!uploadedUrl) throw new Error("Upload failed");

      // 4️⃣ Format recipient number
      let toNumber = (salary.phoneNumber || "").replace(/\D+/g, "");
      if (!toNumber) throw new Error("Phone number missing");// remove non-digits
      if (!toNumber.startsWith("91")) toNumber = "91" + toNumber;

// 5️⃣ Build and open WhatsApp message
      const message = [
        `Hi ${salary.employeeName},`,
        "",
        `Please find your salary slip for *${salaryMonthInfo.display}* attached:`,
        uploadedUrl,
        "",
        "Thank you!",
        "— Europass Immigration Pvt Ltd",
      ].join("\n");

      const waUrl = `https://api.whatsapp.com/send?phone=${toNumber}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    } catch (err: any) {
      setError(err.message || "Failed to send via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !salary || isGeneratingPDF) return <Loader />;

  // Calculations
  const earningsFields = [
    "basicSalary", "hra", "telephoneReimbursement",
    "bonus", "lta", "specialAllowancePetrolAllowance", "incentive",
  ];
  const totalEarnings = earningsFields.reduce((sum, field) => sum + (Number(salary[field]) || 0), 0);

  const deductionsFields = ["incomeTax", "providentFund", "professionalTax", "lop"];
  const totalDeductions = deductionsFields.reduce((sum, field) => sum + (Number(salary[field]) || 0), 0);

  const netPayment = totalEarnings - totalDeductions;

  const summary = salary.summary as {
    leavesTakenThisMonth?: number;
    absentsThisMonth?: number;
    entitlementThisMonth?: number;
  } | undefined;

  const leavesTaken = summary?.leavesTakenThisMonth ?? 0;
  const absents = summary?.absentsThisMonth ?? 0;
  const entitlement = summary?.entitlementThisMonth ?? 1.5;

 // 1️⃣ Compute overhead leaves = max(leavesTakenThisMonth – 1.5, 0)
  const overheadLeaves = Math.max(leavesTaken - entitlement, 0);
 // 2️⃣ Total LOP days = absents + overheadLeaves
  const totalLOPDays = absents + overheadLeaves;

 // 3️⃣ Days in month (derive from salary.salaryDate)
  const perDaySalary = salaryMonthInfo.daysInMonth > 0 ? totalEarnings / salaryMonthInfo.daysInMonth : 0;
// 6️⃣ LOP amount = perDaySalary × totalLOPDays
  const lopAmount = perDaySalary * totalLOPDays;

  return (
    <div className="container mt-10">
      <div className="flex justify-between mb-4">
        <Link
          className="text-blue-500 underline hover:text-deepblue cursor-pointer"
          href="/hrSystem/salary"
        >
          Back
        </Link>
        <div className="flex gap-5">
          <button onClick={handleEdit} className="text-blue-500 hover:text-deepblue">
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={handlePdf} className="text-blue-500 hover:text-deepblue">
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button onClick={handlePrint} className="text-blue-500 hover:text-deepblue">
            <FontAwesomeIcon icon={faPrint} />
          </button>
          <button onClick={handleWhatsapp} className="text-green-500">
            <FontAwesomeIcon className="h-8 w-8" icon={faWhatsapp} />
          </button>
        </div>
      </div>
{/* Display User Error */}
      {userError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{userError}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center">
        <img
          src="/logo.png"
          alt="Watermark"
          className="w-4/6 h-auto max-w-full max-h-full object-contain transform -translate-y-1/2 absolute top-1/2"
        />
      </div>

      <div id="printable-section" className="space-y-6 relative z-10">
        {/* Header */}
        <div className="border-b-2 pb-4">
          <div className="text-center">
            {/* Logo */}
            <div className="flex flex-col justify-center items-center">
              <img src="/logo.png" alt="Logo" className="h-11" />
              <h1 className="text-md font-extrabold text-deepblue mt-2">
                EUROPASS IMMIGRATION PRIVATE LIMITED
              </h1>
            </div>
            {/* Address */}
            <div className="text-sm text-gray-800 mt-2">
              <p className="font-bold text-deepblue">
                Office No.606, 6th Floor, Verma Centre, Boring Rd, Crossing, Sri Krishna Puri, Patna, Bihar 800001
              </p>
            </div>
            {/* Payslip of the Month */}
            <div className="mt-4 text-sm font-bold text-deepblue">
              <p>
                PAYSLIP OF THE MONTH:{" "}
                <span className="font-bold text-deepblue">
                  {salaryMonthInfo.display}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-800">
          <div className="space-y-4">
            <div className="font-bold">Employee ID:</div>
            <div className="border px-4 py-2 rounded-md">{salary.employeeId}</div>

            <div className="font-bold">Gender:</div>
            <div className="border px-4 py-2 rounded-md">{salary.gender}</div>

            <div className="font-bold">D.O.B.:</div>
            <div className="border px-4 py-2 rounded-md">{salary.dob || "N/A"}</div>

            <div className="font-bold">D.O.J.:</div>
            <div className="border px-4 py-2 rounded-md">{salary.doj || "N/A"}</div>

            <div className="font-bold">Designation:</div>
            <div className="border px-4 py-2 rounded-md">{salary.designation}</div>

            <div className="font-bold">Department:</div>
            <div className="border px-4 py-2 rounded-md">{salary.department}</div>

            <div className="font-bold">Location:</div>
            <div className="border px-4 py-2 rounded-md">{salary.location}</div>

            <div className="font-bold">Loss of Pay (LOP):</div>
            <div className="border px-4 py-2 rounded-md">{salary.lop ? Number(salary.lop).toFixed(2) : "0.00"}</div>

            {summary && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">LOP Calculation Details</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  {/* 1. Leaves Taken → Overhead */}
                  <div><span className="font-medium">Leaves Taken:</span> {leavesTaken}</div>
                  <div>
                    <span className="font-medium">Overhead Leaves:</span>{" "}
                    <span className="text-red-600">
                      {leavesTaken} – {entitlement} = {overheadLeaves.toFixed(2)}
                    </span>
                  </div>
                  {/* 4. Days in month */}
                  <div><span className="font-medium">Absents:</span> {absents}</div>
                  <div>
                    <span className="font-medium">Total LOP Days:</span>{" "}
                    <strong>{totalLOPDays.toFixed(2)}</strong>
                  </div>
{/* 5. Total Earnings */}
                  <div>
                    <span className="font-medium">Days in {salaryMonthInfo.display}:</span>{" "}
                    <strong>{salaryMonthInfo.daysInMonth}</strong>
                  </div>
                   {/* 6. Per-day Salary */}
                  <div><span className="font-medium">Total Earnings:</span> {totalEarnings.toFixed(2)}</div>
                  <div>
                    <span className="font-medium">Per-day Salary:</span>{" "}
                    <strong>{perDaySalary.toFixed(2)}</strong>
                  </div>
                  {/* 7. LOP Amount */}
                  <div>
                    <span className="font-medium text-red-600">LOP Amount:</span>{" "}
                    <strong className="text-red-600">{lopAmount.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="font-bold">Employee Name:</div>
            <div className="border px-4 py-2 rounded-md">{salary.employeeName}</div>

            <div className="font-bold">Bank Name:</div>
            <div className="border px-4 py-2 rounded-md">{salary.bankName}</div>

            <div className="font-bold">Bank Account Number:</div>
            <div className="border px-4 py-2 rounded-md">{salary.bankAccountNumber}</div>

            <div className="font-bold">IFSC:</div>
            <div className="border px-4 py-2 rounded-md">{salary.ifsc}</div>

            <div className="font-bold">PAN:</div>
            <div className="border px-4 py-2 rounded-md">{salary.pan}</div>
          </div>
        </div>

        {/* Earnings */}
        <div className="mt-5">
          <h2 className="font-bold text-lg mb-2">Earnings</h2>
          <table className="w-3/4 mx-auto table-auto border-collapse border border-deepblue rounded-md shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">Component</th>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earningsFields.map((field) => (
                <tr key={field}>
                  <td className="border px-3 py-1 text-sm">
                    {field.replace(/([A-Z])/g, " $1").trim().toUpperCase()}:
                  </td>
                  <td className="border px-3 py-1 text-sm">{Number(salary[field] || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold border px-3 py-1 text-sm">Total Earnings:</td>
                <td className="border px-3 py-1 text-sm">{totalEarnings.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">Deductions</h2>
          <table className="w-3/4 mx-auto table-auto border-collapse border border-deepblue rounded-md shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">Component</th>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {["incomeTax", "providentFund", "professionalTax"].map((field) => (
                <tr key={field}>
                  <td className="border px-3 py-1 text-sm">
                    {field.replace(/([A-Z])/g, " $1").trim().toUpperCase()}:
                  </td>
                  <td className="border px-3 py-1 text-sm">{Number(salary[field] || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td className="border px-3 py-1 text-sm">LOSS OF PAY (LOP):</td>
                <td className="border px-3 py-1 text-sm text-red-600 font-medium">
                  {Number(salary.lop || 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold border px-3 py-1 text-sm">Total Deductions:</td>
                <td className="border px-3 py-1 text-sm">{totalDeductions.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Net Payment */}
        <div className="mt-4">
          <h2 className="font-bold text-lg mb-2">Net Payment for the Month</h2>
          <div className="border-2 border-deepblue px-8 py-4 rounded-lg text-2xl font-bold text-deepblue">
            ₹{netPayment.toFixed(2)}
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-gray-600">
          <hr className="border-t-2 border-gray-300 w-1/2 mx-auto mb-4" />
          <p className="italic">
            This is a system-generated payslip and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipPage;