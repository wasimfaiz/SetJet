"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import apiClient from "@/app/utils/apiClient";
import Loader from "@/app/components/loader";
import EmployeeListModal from "@/app/components/employeeModal";

interface SalarySlipFields {
  _id?: any;
  employeeName: string;
  employeeId: string;
  gender: string;
  designation: string;
  dob: string;
  doj: string;
  department: string;
  location: string;
  lop: string; // auto-populated or from initialData
  bankName: string;
  bankAccountNumber: string;
  ifsc: string;
  pan: string;
  basicSalary: any;
  hra: any;
  telephoneReimbursement: any;
  bonus: any;
  lta: any;
  specialAllowancePetrolAllowance: any;
  incentive: any;
  deductions: any;
  incomeTax: any;
  providentFund: any;
  professionalTax: any;
  netSalary: any;
  salaryDate: string; // Payment date: YYYY-MM-DD
  phoneNumber: string;
  summary?: any; // may or may not exist in initialData
}

interface Employee {
  basicField: {
    empId: string;
    name: string;
    jobRole: string;
    gender: string;
    dob: string;
    doj: string;
    department: string;
    jobLocation: string;
    pan: string;
    phoneNumber: string;
  };
  bankField: {
    bankName: string;
    bankAccountNumber: string;
    ifscCode: string;
  };
  earning: {
    basicSalary: any;
    hra: any;
    telephoneReimbursement: any;
    bonus: any;
    lta: any;
    specialAllowancePetrolAllowance: any;
    incentive: any;
  };
  tax: {
    incomeTax: any;
    providentFund: any;
    professionalTax: any;
  };
  _id: string;
}

interface LeaveSummary {
  employeeId: string;
  year: string;
  month: string;
  entitlementThisMonth: number;
  leavesTakenThisMonth: number;
  absentsThisMonth: number;
  carryoverFromPreviousMonths: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SalarySlipPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [initialData, setInitialData] = useState<SalarySlipFields | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [summary, setSummary] = useState<LeaveSummary | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalarySlipFields>({
    defaultValues: {},
  });

  // Determine edit mode and whether stored summary exists
  const isEditMode = initialData !== null;
  const hasExistingSummary = isEditMode && initialData?.summary && Object.keys(initialData.summary).length > 0;

// watch earnings fields together so we can trigger LOP recalculation
  const salaryDate = watch("salaryDate"); // Payment date
  const watchedEarnings = [
    watch("basicSalary"),
    watch("hra"),
    watch("telephoneReimbursement"),
    watch("bonus"),
    watch("lta"),
    watch("specialAllowancePetrolAllowance"),
    watch("incentive"),
  ];

  // Helper: Determine which month the salary is FOR based on payment date
  const getSalaryMonthYear = () => {
    if (!salaryDate) return { year: null, monthIndex: null, monthName: null };

    const paymentDate = new Date(salaryDate);
    const paymentDay = paymentDate.getDate();
    let targetDate = paymentDate;

    if (paymentDay <= 30) {
      // Paid early → salary for previous month
      targetDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() - 1);
    }

    return {
      year: targetDate.getFullYear(),
      monthIndex: targetDate.getMonth(),
      monthName: monthNames[targetDate.getMonth()],
    };
  };

  // Display formatted salary month/year in header
  const getSalaryMonthYearDisplay = () => {
    if (!salaryDate) return "Select a Salary Date";

    const paymentDate = new Date(salaryDate);
    const paymentDay = paymentDate.getDate();
    let displayDate = paymentDate;

    if (paymentDay <= 30) {
      displayDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() - 1);
    }

    return `${displayDate.toLocaleString("default", { month: "long" })} ${displayDate.getFullYear()}`;
  };

  // LOP Calculation Effect — NOW USES CORRECT SALARY MONTH
  useEffect(() => {
    // If editing and a proper summary exists, use stored LOP and skip fetch
    if (isEditMode && hasExistingSummary) {
      setValue("lop", initialData!.lop ?? "0");
      return;
    }

    // Guard: must have employee (_id from selectedEmployee) and salaryDate
    if (!selectedEmployee?._id || !salaryDate) {
      setValue("lop", "0");
      setSummary(null);
      return;
    }

    const { year, monthIndex, monthName } = getSalaryMonthYear();
    if (year === null || monthIndex === null || monthName === null) {
      setValue("lop", "0");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get<{
          records?: any[];
          summary?: LeaveSummary;
        }>(
          `/api/leaves?employeeId=${selectedEmployee._id}&year=${year}&month=${monthName}`
        );

        const fetchedSummary = res.data?.summary ?? null;
        if (cancelled) return;

        if (!fetchedSummary) {
          setSummary(null);
          setValue("lop", "0");
          return;
        }

        setSummary(fetchedSummary);

        const entitlement = typeof fetchedSummary.entitlementThisMonth === "number"
          ? fetchedSummary.entitlementThisMonth
          : 1.5;
        const taken = fetchedSummary.leavesTakenThisMonth ?? 0;
        const absents = fetchedSummary.absentsThisMonth ?? 0;
        const overheadLeaves = Math.max(taken - entitlement, 0);
        const totalLOPDays = absents + overheadLeaves;

        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
         // Determine totalEarnings (sum of watched earnings)
        // If you want LOP based on BASIC only, replace this with Number(watch('basicSalary') || 0)

        const totalEarnings = watchedEarnings.reduce((sum, val) => sum + Number(val || 0), 0);
        const perDay = daysInMonth > 0 ? totalEarnings / daysInMonth : 0;
        const lopAmount = perDay * totalLOPDays;

        setValue("lop", Number(lopAmount || 0).toFixed(2));
      } catch (err) {
        console.error("Error fetching leave summary for LOP:", err);
        if (!cancelled) setValue("lop", "0");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedEmployee?._id,
    salaryDate,
    isEditMode,
    hasExistingSummary,
    initialData,
    ...watchedEarnings,
    setValue,
  ]);

  // Calculations
  const calculateTotalEarnings = () => {
    const fields: Array<keyof SalarySlipFields> = [
      "basicSalary", "hra", "telephoneReimbursement", "bonus",
      "lta", "specialAllowancePetrolAllowance", "incentive",
    ];
    return fields.reduce((sum, field) => sum + Number(watch(field) || 0), 0);
  };

  const calculateTotalDeductions = () => {
    return [
      Number(watch("lop") || 0),
      Number(watch("incomeTax") || 0),
      Number(watch("providentFund") || 0),
      Number(watch("professionalTax") || 0),
    ].reduce((a, b) => a + b, 0);
  };

  const calculateNetSalary = () => {
    return calculateTotalEarnings() - calculateTotalDeductions();
  };

  // Fetch employees
  useEffect(() => {
    let cancelled = false;
    async function fetchEmployees() {
      try {
        const response = await apiClient.get("/api/employees?status=ACTIVE");
        if (!cancelled) setEmployees(response.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    }
    fetchEmployees();
    return () => { cancelled = true; };
  }, []);

  // Fetch existing salary slip
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchSalarySlipData() {
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/salary?id=${id}`);
        const data: SalarySlipFields = response.data;
        if (cancelled) return;

        setInitialData(data);

        const toFormatted = (dateString: any) => {
          if (!dateString) return "";
          const d = new Date(dateString);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        };

        // populate
        setValue("employeeId", data.employeeId);
        setValue("employeeName", data.employeeName);
        setValue("dob", toFormatted(data.dob));
        setValue("gender", data.gender);
        setValue("doj", toFormatted(data.doj));
        setValue("salaryDate", data.salaryDate);
        setValue("lop", data.lop || "0");
        setValue("designation", data.designation);
        setValue("bankName", data.bankName);
        setValue("bankAccountNumber", data.bankAccountNumber);
        setValue("ifsc", data.ifsc);
        setValue("pan", data.pan);
        setValue("department", data.department);
        setValue("location", data.location);
        setValue("basicSalary", data.basicSalary);
        setValue("bonus", data.bonus);
        setValue("hra", data.hra);
        setValue("telephoneReimbursement", data.telephoneReimbursement);
        setValue("lta", data.lta);
        setValue("specialAllowancePetrolAllowance", data.specialAllowancePetrolAllowance);
        setValue("incentive", data.incentive);
        setValue("incomeTax", data.incomeTax);
        setValue("providentFund", data.providentFund);
        setValue("professionalTax", data.professionalTax);
        setValue("phoneNumber", data.phoneNumber);

        if (data.summary) setSummary(data.summary);
      } catch (err) {
        console.error("Error fetching salary slip data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSalarySlipData();
    return () => { cancelled = true; };
  }, [id, setValue]);

  // handle employee selection
  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find(e => e._id === employeeId || e.basicField.empId === employeeId);
    if (!emp) return;

    setSelectedEmployee(emp);

    const formatForInput = (dateString: any) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    setValue("employeeId", emp.basicField.empId || emp._id);
    setValue("employeeName", emp.basicField.name);
    setValue("designation", emp.basicField.jobRole || "");
    setValue("gender", emp.basicField.gender || "");
    setValue("dob", emp.basicField.dob ? formatForInput(emp.basicField.dob) : "");
    setValue("doj", emp.basicField.doj ? formatForInput(emp.basicField.doj) : "");
    setValue("bankName", emp.bankField.bankName);
    setValue("bankAccountNumber", emp.bankField.bankAccountNumber);
    setValue("ifsc", emp.bankField.ifscCode);
    setValue("pan", emp.basicField.pan);
    setValue("department", emp.basicField.department);
    setValue("location", emp.basicField.jobLocation);
    setValue("phoneNumber", emp.basicField.phoneNumber || "");

    setValue("basicSalary", emp.earning?.basicSalary ?? 0);
    setValue("hra", emp.earning?.hra ?? 0);
    setValue("telephoneReimbursement", emp.earning?.telephoneReimbursement ?? 0);
    setValue("bonus", emp.earning?.bonus ?? 0);
    setValue("lta", emp.earning?.lta ?? 0);
    setValue("specialAllowancePetrolAllowance", emp.earning?.specialAllowancePetrolAllowance ?? 0);
    setValue("incentive", emp.earning?.incentive ?? 0);

    setValue("incomeTax", emp.tax?.incomeTax ?? 0);
    setValue("providentFund", emp.tax?.providentFund ?? 0);
    setValue("professionalTax", emp.tax?.professionalTax ?? 0);
  };

  if (loading) return <Loader />;

  const handleFormSubmit = async (data: SalarySlipFields) => {
    data.summary = summary;
    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData ? `/api/salary?id=${id}` : "/api/salary";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        router.push(`/hrSystem/salary/${result.id}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>

      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center mt-34">
        <img src="/logo.png" alt="Watermark" className="w-4/6 h-auto sm:w-3/4 md:w-2/3 right-2 max-w-full max-h-full object-contain transform -translate-y-3/2 absolute top-1/2" />
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="border-b-2 pb-4">
          <div className="text-center">
            <div className="flex flex-col justify-center items-center">
              <img src="/logo.png" alt="Logo" className="h-11 ml-1" />
              <h1 className="text-md font-extrabold text-deepblue mt-2">
                EUROPASS IMMIGRATION PRIVATE LIMITED
              </h1>
            </div>
            <div className="text-sm text-gray-800 mt-2">
              <p className="font-bold text-deepblue">
                Office No.606, 6th Floor, Verma Centre, Boring Rd, Crossing, Sri Krishna Puri, Patna, Bihar 800001
              </p>
            </div>
            <div className="mt-4 text-sm font-bold text-deepblue">
              <p>
                PAYSLIP OF THE MONTH{" "}
                <span className="font-normal text-deepblue font-bold">
                  ({getSalaryMonthYearDisplay()})
                </span>
              </p>
            </div>
          </div>

          {/* Employee Selector */}
          <div className="flex flex-col mt-2 border-deepblue">
            <p
              className="w-1/3 bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen ml-2 text-white rounded-lg text-xs md:text-sm lg:text-base px-4 py-1 md:px-6 md:py-2 lg:px-8 lg:py-3 cursor-pointer"
              onClick={() => setShowEmployeeModal(true)}
            >
              {selectedEmployee?.basicField?.name || "Select Employee"}
            </p>
          </div>

          <div className="flex justify-end mt-4">
            <p className="text-md font-bold text-deepblue">Salary Slip</p>
          </div>
        </div>

        {/* Employee & Bank Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-800">
          <div className="space-y-4">
            <div>
              <label htmlFor="employeeId" className="font-bold">
                Employee ID:
              </label>
              <input
                id="employeeId"
                type="text"
                {...register("employeeId", {
                  required: "Employee ID is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.employeeId && (
                <span className="text-red-500">
                  {errors.employeeId.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="gender" className="font-bold">
                Gender:
              </label>
              <input
                id="gender"
                type="text"
                {...register("gender", { required: "Gender is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.gender && (
                <span className="text-red-500">{errors.gender.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="dob" className="font-bold">
                D.O.B.:
              </label>
              <input
                id="dob"
                type="date"
                {...register("dob", { required: "Date of birth is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.dob && (
                <span className="text-red-500">{errors.dob.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="doj" className="font-bold">
                D.O.J.:
              </label>
              <input
                id="doj"
                type="date"
                {...register("doj", {
                  required: "Date of joining is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.doj && (
                <span className="text-red-500">{errors.doj.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="designation" className="font-bold">
                Designation:
              </label>
              <input
                id="designation"
                type="text"
                {...register("designation", {
                  required: "Designation is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.designation && (
                <span className="text-red-500">
                  {errors.designation.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="department" className="font-bold">
                Department:
              </label>
              <input
                id="department"
                type="text"
                {...register("department", {
                  required: "Department is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.department && (
                <span className="text-red-500">
                  {errors.department.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="location" className="font-bold">
                Location:
              </label>
              <input
                id="location"
                type="text"
                {...register("location", { required: "Location is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.location && (
                <span className="text-red-500">{errors.location.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="lop" className="font-bold">
                Loss of pay (LOP):
              </label>
              <input
                id="lop"
                type="text"
                {...register("lop")}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
            </div>
            <div>
              <label htmlFor="salaryDate" className="font-bold">
                Salary Date:
              </label>
              <input
                id="salaryDate"
                type="date"
                {...register("salaryDate", {
                  required: "Salary date is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
              />
              {errors.salaryDate && (
                <span className="text-red-500">
                  {errors.salaryDate.message}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="employeeName" className="font-bold">
                Employee Name:
              </label>
              <input
                id="employeeName"
                type="text"
                {...register("employeeName", {
                  required: "Employee name is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.employeeName && (
                <span className="text-red-500">
                  {errors.employeeName.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="bankName" className="font-bold">
                Bank Name:
              </label>
              <input
                id="bankName"
                type="text"
                {...register("bankName", { required: "Bank name is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.bankName && (
                <span className="text-red-500">{errors.bankName.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="bankAccountNumber" className="font-bold">
                Bank Account Number:
              </label>
              <input
                id="bankAccountNumber"
                type="text"
                {...register("bankAccountNumber", {
                  required: "Bank account number is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.bankAccountNumber && (
                <span className="text-red-500">
                  {errors.bankAccountNumber.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="ifsc" className="font-bold">
                IFSC:
              </label>
              <input
                id="ifsc"
                type="text"
                {...register("ifsc", { required: "IFSC code is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.ifsc && (
                <span className="text-red-500">{errors.ifsc.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="pan" className="font-bold">
                PAN:
              </label>
              <input
                id="pan"
                type="text"
                {...register("pan", { required: "PAN number is required" })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.pan && (
                <span className="text-red-500">{errors.pan.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="font-bold">
                Phone Number:
              </label>
              <input
                id="phoneNumber"
                type="text"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                })}
                className="w-full border px-4 py-2 rounded-md mt-2"
                readOnly
              />
              {errors.phoneNumber && (
                <span className="text-red-500">
                  {errors.phoneNumber.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="mt-5">
          <h2 className="font-bold text-lg mb-2">Earnings</h2>
          <table className="w-3/4 mx-auto table-auto border-collapse border border-deepblue rounded-md shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">
                  Component
                </th>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                "basicSalary",
                "hra",
                "telephoneReimbursement",
                "bonus",
                "lta",
                "specialAllowancePetrolAllowance",
                "incentive",
              ].map((field) => (
                <tr key={field} className="hover:bg-gray-50 transition-colors">
                  <td className="border px-3 py-1 text-sm">
                    {field === "specialAllowancePetrolAllowance"
                      ? "Special Allowance / Petrol Allowance"
                      : field.replace(/([A-Z])/g, " $1").toUpperCase()}
                    :
                  </td>
                  <td className="border px-3 py-1 text-sm">
                    <input
                      id={field}
                      type="number"
                      {...register(field as keyof SalarySlipFields, {
                        valueAsNumber: true,
                      })}
                      className="w-full border px-3 py-1 rounded-md text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold border px-3 py-1 text-sm">
                  Total Earnings:
                </td>
                <td className="border px-3 py-1 text-sm">
                  <input
                    id="totalEarnings"
                    type="text"
                    value={calculateTotalEarnings()}
                    disabled
                    className="w-full border px-3 py-1 rounded-md bg-gray-100 text-sm"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions Table (includes LOP) */}
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">Deductions</h2>
          <table className="w-3/4 mx-auto table-auto border-collapse border border-deepblue rounded-md shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">
                  Component
                </th>
                <th className="border bg-deepblue text-white px-3 py-1 text-left text-sm">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {/* LOP first */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="border px-3 py-1 text-sm">Loss of Pay (LOP):</td>
                <td className="border px-3 py-1 text-sm">
                  <input
                    id="lop"
                    type="text"
                    {...register("lop")}
                    className="w-full border px-3 py-1 rounded-md bg-gray-100"
                    readOnly
                  />
                </td>
              </tr>
              {/* Other deduction fields */}
              {["incomeTax", "providentFund", "professionalTax"].map(
                (field) => (
                  <tr
                    key={field}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border px-3 py-1 text-sm">
                      {field.replace(/([A-Z])/g, " $1").toUpperCase()}:
                    </td>
                    <td className="border px-3 py-1 text-sm">
                      <input
                        id={field}
                        type="number"
                        {...register(field as keyof SalarySlipFields, {
                          valueAsNumber: true,
                        })}
                        className="w-full border px-3 py-1 rounded-md"
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold border px-3 py-1 text-sm">
                  Total Deductions:
                </td>
                <td className="border px-3 py-1 text-sm">
                  <input
                    id="totalDeductions"
                    type="text"
                    value={calculateTotalDeductions()}
                    disabled
                    className="w-full border px-3 py-1 rounded-md bg-gray-100 text-sm"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Net Salary */}
        <div className="mt-4">
          <div className="font-bold text-lg mb-2">
            Net Payment For the Month
          </div>
          <div className="border px-4 py-2 rounded-md">
            <input
              id="netSalary"
              type="text"
              value={calculateNetSalary()}
              disabled
              className="w-full border px-3 py-2 rounded-md bg-gray-100 text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 text-right">
          <button
            type="submit"
            className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
          >
            Submit Salary Slip
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-gray-600">
          <hr className="border-t-2 border-gray-300 w-1/2 mx-auto mb-4" />
          <p className="italic">
            This is a system-generated payslip and does not require a signature.
          </p>
        </div>
      </form>

      <EmployeeListModal
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        //@ts-ignore
        handleEmployee={handleEmployeeChange}
      />
    </div>
  );
};

const SalarySlipAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SalarySlipPage />
    </Suspense>
  );
};

export default SalarySlipAddPage;
