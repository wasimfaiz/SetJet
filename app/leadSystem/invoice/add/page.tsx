"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Pagination from "@/app/components/pagination";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import { useEmployeeContext } from "@/app/contexts/employeeContext";

// Define the type for Invoice fields
interface InvoiceItem {
  itemDate: string; // NEW: Date for each item
  description: string;
  packageamount: string;
  gst: string;
  totalamount: string;
  paidamount: string;
  balanceamount: string;
  paymentMode: string;
}

interface InvoiceFields {
  _id?: any;
  to: string;
  mobile: string;
  date: string;
  gstNumber: string;
  invoiceNumber: string;
  description: string;
  packageamount: number;
  paidamount: number;
  gst: string;
  from: string;
  address: string;
  bank: string;
  accNo: string;
  ifsc: string;
  upi: string;
  invoiceFor: string;
  countryApplyingFor: string;
  courseApplyingFor: string;
  paymentMode: string;
  items: InvoiceItem[];
  createdAt: string; // Added createdAt field
  by: any;
  salesEmployee: string;
}

const InvoiceAddPageInvoice = () => {
  const router = useRouter();
  const { employeeId, employeeName } = useEmployeeContext();

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState<InvoiceFields | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [invoiceNumberError, setInvoiceNumberError] = useState<string | null>(
    null
  );
  const [showInvoiceNumberAlert, setShowInvoiceNumberAlert] =
    useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<any[]>([]);

  const paymentOptions = ["", "ONLINE", "CASH", "OTHERS"];
  // Define the options for the "Looking For" dropdown
  const lookingForOptions = [
    "", // Add a blank option for "No Selection"
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
    "", // Add a blank option for "No Selection"

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

  // Set default values for `from`, `address`, `bank`, `accNo`, `ifsc`, and `upi`
  const defaultInvoiceFields = {
    from: "Europass Immigration PRIVATE LIMITED",
    address:
      "Office No.606,6th Floor,Verma Centre,Boring Rd,crossing,Sri Krishna Puri,Patna,Bihar 800001",
    bank: "HDFC",
    accNo: "50200112224397",
    ifsc: "HDFC0000235",
    upi: "7505822022@hdfcbank",
    gstNumber: "10AAHCE6130D1ZD",
    invoiceFor: "", // Initialize invoiceFor
    CountryApplyingfor: "",
    paymentMode: "",
    salesEmployee: "",
  };

  // React Hook Form setup WITH validation
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues, // getValues
    formState: { errors },
  } = useForm<InvoiceFields>({
    defaultValues: {
      items: [
        {
          itemDate: new Date().toISOString().split("T")[0],
          description: "",
          packageamount: "",
          paidamount: "",
          gst: "",
          totalamount: "",
          balanceamount: "",
          paymentMode: "",
        },
      ],
      ...defaultInvoiceFields,
      //createdAt: new Date().toISOString(), // Set initial createdAt value // Remove it from here
    },
    mode: "onBlur", // Validate on blur
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch all items for changes
  const watchItems = watch("items");
  const watchDate = watch("date"); // Watch the date field
  const watchCreatedAt = watch("createdAt");

  // Function to calculate total amount (Package Amount + GST)
  const calculateTotalAmount = (packageamount: string, gst?: string) => {
    if (!packageamount) {
      return "";
    }

    const packageAmt = parseFloat(packageamount) || 0;
    const gstValue = gst ? parseFloat(gst) || 0 : 0;
    const gstAmount = (packageAmt * gstValue) / 100;

    return (packageAmt + gstAmount).toFixed(2);
  };

  // Function to calculate balance amount (Total - Paid)
  const calculateBalanceAmount = (totalamount: string, paidamount: string) => {
    if (!totalamount || !paidamount) {
      return "";
    }
    const total = parseFloat(totalamount) || 0;
    const paid = parseFloat(paidamount) || 0;

    return (total - paid).toFixed(2);
  };

  // Update total amount and balance amount whenever any field changes
  useEffect(() => {
    if (watchItems) {
      watchItems.forEach((item, index) => {
        // Calculate Total Amount first
        const total = calculateTotalAmount(item.packageamount, item.gst);
        setValue(`items.${index}.totalamount`, total);

        // Then calculate Balance Amount based on the new Total Amount
        const balance = calculateBalanceAmount(total, item.paidamount);
        setValue(`items.${index}.balanceamount`, balance);
      });
    }
  }, [watchItems, setValue]);

  // Fetch initial data for editing an existing invoice
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (id) {
        setLoading(true);
        try {
          const response = await apiClient.get(`/api/invoice?id=${id}`);
          const data = response.data?.invoice;
          setInitialData(data);
          reset({
            ...data,
            items: data.items || [
              {
                itemDate: new Date().toISOString().split("T")[0],
                description: "",
                packageamount: "",
                paidamount: "",
                gst: "",
                totalamount: "",
                balanceamount: "",
                paymentMode: "",
              },
            ],
            // createdAt: data.createdAt // Preserve existing createdAt
          });
        } catch (error) {
          console.error("Error fetching invoice data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInvoiceData();
  }, [id, reset]);
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/employees?status=ACTIVE");
      // Transform data into label and value format
      const employeesData = response.data
        .map((employee: any) => {
          if (!employee.basicField?.email || !employee._id) {
            console.warn("Skipping employee with missing data:", employee);
            return null;
          }
          return {
            label: employee.basicField.email,
            value: employee.basicField._id,
          };
        })
        .filter(Boolean); // Remove null entries

      setEmployeeData(employeesData);
    } catch (err) {
      console.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEmployees();
  }, []);
  if (loading) {
    return <Loader />;
  }

  // Form submit handler
  const handleFormSubmit = async (data: InvoiceFields) => {
    try {
      setInvoiceNumberError(null); // Clear any previous error
      setShowInvoiceNumberAlert(false); // Hide alert
      const selected = employeeData.find((e) => e.label === data.salesEmployee);

      // Add createdAt to the form data before submitting
      const formData = {
        ...data,
        createdAt: new Date().toISOString(), // Add createdAt here
        by: {
          employeeName: employeeName,
          employeeId: employeeId,
        },
      };
      // Remove _id if it's an update (PUT request)
      if (id) {
        delete formData._id;
        //@ts-ignore
        delete formData.by;
      }

      const method = initialData ? "PUT" : "POST"; // Use PUT for editing and POST for adding
      const url = initialData ? `/api/invoice?id=${id}` : "/api/invoice";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send data with the  date
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Form Data Submitted Successfully:", result);
        //@ts-ignore
        router.push(`/leadSystem/invoice/${result?.id}`); // Redirect after successful submission
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
        if (
          errorData.error ===
          "Invoice number already exists. Please use a unique number."
        ) {
          setInvoiceNumberError(errorData.error);
          setShowInvoiceNumberAlert(true); // Show alert
        } else {
          console.error("Error submitting form:", errorData.error);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleAddItem = () => {
    append({
      itemDate: new Date().toISOString().split("T")[0], // Set the itemDate
      description: "",
      packageamount: "",
      gst: "",
      totalamount: "",
      paidamount: "",
      balanceamount: "",
      paymentMode: "",
    });
  };

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
      <div className="absolute inset-0 pointer-events-none opacity-10 flex justify-center items-center">
        <img
          src="/logo.png"
          alt="Watermark"
          className="w-2/4 h-auto max-w-full max-h-full object-contain"
        />
      </div>

      {/* Invoice Number Alert */}
      {showInvoiceNumberAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 bg-white rounded-md max-w-md mx-auto">
            <div className="text-center">
              <h3 className="text-lg font-medium text-deepblue">
                Duplicate Invoice Number
              </h3>
              <div className="mt-2">
                <p className="text-sm text-deepblue">
                  The Invoice Number already exists. Please use a unique number.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  className="px-4 py-2 bg-bloodred text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  onClick={() => setShowInvoiceNumberAlert(false)}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-center border-b-2 pb-4">
          <div className="flex justify-center w-full items-center">
            <img src="/logo.png" alt="Logo" className="h-11 ml-1" />
            <h1 className="text-3xl font-bold text-deepblue">
              EUROPASS IMMIGRATION PRIVATE LIMITED
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-deepblue">Invoice</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
          <div>
            <label htmlFor="to" className="font-bold">
              Bill to:
            </label>
            <input
              id="to"
              type="text"
              {...register("to", { required: "Bill to is required" })}
              placeholder="To"
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
            {errors.to && (
              <p className="text-red-500 text-xs mt-1">{errors.to.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="to" className="font-bold">
              Mobile Number:
            </label>
            <input
              id="to"
              type="text"
              {...register("mobile", { required: "Mobile Number is required" })}
              placeholder="Mobile Number"
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
            {errors.mobile && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mobile.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="date" className="font-bold">
              Date:
            </label>
            <input
              id="date"
              type="date"
              {...register("date", { required: "Date is required" })}
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="gstNumber" className="font-bold">
              GST Number:
            </label>
            <input
              id="gstNumber"
              type="text"
              {...register("gstNumber")}
              placeholder="GST Number"
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
          </div>
          <div>
            <label htmlFor="invoiceNumber" className="font-bold">
              Invoice No.:
            </label>
            <input
              id="invoiceNumber"
              type="text"
              {...register("invoiceNumber", {
                required: "Invoice Number is required",
              })}
              placeholder="Invoice Number"
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
            {errors.invoiceNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.invoiceNumber.message}
              </p>
            )}
            {invoiceNumberError && (
              <p className="text-red-500 text-xs mt-1">{invoiceNumberError}</p>
            )}
          </div>
          {/* Disable these fields */}
          <div>
            <label htmlFor="from" className="font-bold">
              From:
            </label>
            <input
              id="from"
              type="text"
              {...register("from")}
              placeholder="From"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="address" className="font-bold">
              Address:
            </label>
            <input
              id="address"
              type="text"
              {...register("address")}
              placeholder="Address"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="bank" className="font-bold">
              Bank:
            </label>
            <input
              id="bank"
              type="text"
              {...register("bank")}
              placeholder="Bank"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="accNo" className="font-bold">
              Account Number:
            </label>
            <input
              id="accNo"
              type="text"
              {...register("accNo")}
              placeholder="Account Number"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="ifsc" className="font-bold">
              IFSC Code:
            </label>
            <input
              id="ifsc"
              type="text"
              {...register("ifsc")}
              placeholder="IFSC Code"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="upi" className="font-bold">
              UPI ID:
            </label>
            <input
              id="upi"
              type="text"
              {...register("upi")}
              placeholder="UPI ID"
              className="w-full border px-4 py-2 rounded-md mt-2 bg-gray-100"
              readOnly
            />
          </div>
          {/* New Field: Invoice For */}
          <div>
            <label htmlFor="invoiceFor" className="font-bold">
              Invoice For:
            </label>
            <select
              id="invoiceFor"
              {...register("invoiceFor", {
                required: "Invoice For is required",
              })}
              className="w-full border px-4 py-2 rounded-md mt-2"
            >
              {lookingForOptions.map((option) => (
                <option key={option} value={option}>
                  {option || "Select Invoice For"}
                </option>
              ))}
            </select>
            {errors.invoiceFor && (
              <p className="text-red-500 text-xs mt-1">
                {errors.invoiceFor.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="countryApplyingFor" className="font-bold">
              Country Applying For:
            </label>
            <select
              id="countryApplyingFor"
              {...register("countryApplyingFor")}
              className="w-full border px-4 py-2 rounded-md mt-2"
            >
              {CountryApplyingfor.map((option) => (
                <option key={option} value={option}>
                  {option || "Country Applying For"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="CourseApplyingFor" className="font-bold">
              Course Applying For:
            </label>
            <input
              id="CourseApplyingFor"
              type="text"
              {...register("courseApplyingFor")}
              placeholder="Course Applying For"
              className="w-full border px-4 py-2 rounded-md mt-2"
            />
          </div>
          <div>
            <Controller
              name="salesEmployee"
              control={control}
              rules={{ required: "Sales Employee is required" }}
              render={({ field, fieldState }) => {
                // field.value is an object { id, name }
                //@ts-ignore
                const selectedId = field.value || "";

                return (
                  <div>
                    <label htmlFor="salesEmployee">Sales Employee:</label>
                    <select
                      id="salesEmployee"
                      value={selectedId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        // lookup the label/name from your employeeData
                        const found = employeeData.find(
                          (opt) => opt.value === newId
                        );
                        field.onChange(newId);
                      }}
                      className="w-full border px-4 py-2 rounded-md mt-2"
                    >
                      <option value="">Select Sales Employee</option>
                      {employeeData.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {fieldState.error && (
                      <p className="text-red-600">{fieldState.error.message}</p>
                    )}
                  </div>
                );
              }}
            />
            {/* {errors.salesEmployee && (
          <p className="text-red-600 text-sm mt-1">{errors.salesEmployee.message}</p>
        )} */}
          </div>
        </div>

        {/* Items Table */}
        <div className="my-6">
          <table className="w-full text-sm text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-deepblue text-white">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Package Amount</th>
                <th className="border px-4 py-2">Payment Mode</th>
                <th className="border px-4 py-2">GST %</th>
                <th className="border px-4 py-2">Total Amount</th>
                <th className="border px-4 py-2">Paid Amount</th>
                <th className="border px-4 py-2">Balance Amount</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="date"
                      {...register(`items.${index}.itemDate`)}
                      className="w-full border px-4 py-2"
                      placeholder="Date"
                    />
                  </td>
                  <td>
                    <textarea
                      {...register(`items.${index}.description`)}
                      className="w-full border px-4 py-2 resize-none"
                      placeholder="Description"
                      rows={1}
                      onInput={(e) => {
                        //@ts-ignore
                        e.target.style.height = "auto";
                        //@ts-ignore
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                  </td>
                  <td>
                    <input
                      {...register(`items.${index}.packageamount`)} //renamed quantity to packageamount
                      className="w-full border px-4 py-2"
                      placeholder="Package Amount"
                      type="text"
                      step="1"
                      onChange={(e) => {
                        const { value } = e.target;
                        setValue(`items.${index}.packageamount`, value);
                        const gst = watch(`items.${index}.gst`); // Get latest GST value
                        const total = calculateTotalAmount(value, gst); // Recalculate total
                        setValue(`items.${index}.totalamount`, total); // Set Total Amount

                        const paidAmount = watch(`items.${index}.paidamount`); // Get latest Paid amount
                        const balance = calculateBalanceAmount(
                          total,
                          paidAmount
                        ); //Recalculate balance
                        setValue(`items.${index}.balanceamount`, balance); // Set Balance amount
                      }}
                    />
                  </td>
                  <td>
                    <select
                      id="paymentMode"
                      {...register(`items.${index}.paymentMode`, {
                        required: "PaymentMode is required",
                      })}
                      className="w-full border px-4 py-2 rounded-md mt-2"
                    >
                      {paymentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || "Mode"}
                        </option>
                      ))}
                    </select>
                    {errors.items &&
                      errors.items[index] &&
                      errors.items[index].paymentMode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.items[index].paymentMode?.message}
                        </p>
                      )}
                  </td>
                  <td>
                    <input
                      {...register(`items.${index}.gst`)}
                      className="w-full border px-4 py-2"
                      placeholder="GST %"
                      type="text"
                      step="0.01"
                      onChange={(e) => {
                        const { value } = e.target;
                        setValue(`items.${index}.gst`, value);

                        const packageAmount = watch(
                          `items.${index}.packageamount`
                        );
                        const total = calculateTotalAmount(
                          packageAmount,
                          value
                        );
                        setValue(`items.${index}.totalamount`, total);

                        const paidAmount = watch(`items.${index}.paidamount`);
                        const balance = calculateBalanceAmount(
                          total,
                          paidAmount
                        );
                        setValue(`items.${index}.balanceamount`, balance);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      {...register(`items.${index}.totalamount`)}
                      className="w-full border px-4 py-2"
                      placeholder="Total Amount"
                      type="text"
                      step="0.01"
                      readOnly // Make totalAmount read-only as it's calculated
                    />
                  </td>
                  <td>
                    <input
                      {...register(`items.${index}.paidamount`)}
                      className="w-full border px-4 py-2"
                      placeholder="Paid Amount"
                      type="text"
                      step="0.01"
                      onChange={(e) => {
                        const { value } = e.target;
                        setValue(`items.${index}.paidamount`, value);

                        const totalAmount = watch(`items.${index}.totalamount`);
                        const balance = calculateBalanceAmount(
                          totalAmount,
                          value
                        );
                        setValue(`items.${index}.balanceamount`, balance);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      {...register(`items.${index}.balanceamount`)}
                      className="w-full border px-4 py-2 bg-gray-100"
                      placeholder="Balance Amount"
                      readOnly
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Add Item
          </button>
        </div>

        <div className="mt-8 text-right">
          <button
            type="submit"
            className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
          >
            Submit Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

const InvoiceAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceAddPageInvoice />
    </Suspense>
  );
};

export default InvoiceAddPage;
