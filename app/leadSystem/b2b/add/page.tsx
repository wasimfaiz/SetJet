// components/AddBusinessForm.tsx
"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { b2bFields } from "@/app/constants/fields";
import apiClient from "@/app/utils/apiClient";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import ReminderModal from "@/app/components/reminderModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";

interface Option { value: string; label: string; }

const stepKeys = ["basic","address","details","paymentInfo","documentation","remarks"] as const;
type StepKey = typeof stepKeys[number];
const stepLabels = [
  "Basic Information",
  "Address & Location",
  "Business Details",
  "Commission / Payment Info",
  "Documentation",
  "Remarks & Internal Notes",
];

const B2BBusinessPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = Boolean(editId);
  const { employeeId } = useEmployeeContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [business, setBusiness] = useState(null)
  const [businessId, setBusinessId] = useState<string | null>(editId || null);
  const [formData, setFormData] = useState<Record<StepKey, Record<string, any>>>(() =>
    stepKeys.reduce((acc, key) => { acc[key] = {}; return acc; }, {} as Record<StepKey, Record<string, any>>)
  );

  // Selects
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [loadingState, setLoadingState] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(120);
  const [isTimerOver, setIsTimerOver] = useState(false);

  // Remarks
  const [isModalOpen, setIsModalOpen] = useState(false);

  // File upload & loading
  const [uploading, setUploading] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(false);
  const [stepError, setStepError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [countryCode, setCountryCode] = useState('+91');

  const formRef = useRef<HTMLFormElement>(null);

  // Utilities to flatten / nest
  const flatten = (obj: any, prefix = ""): Record<string, any> =>
    Object.entries(obj).reduce((acc, [k, v]) => {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v != null && typeof v === "object" && !Array.isArray(v) && !(v instanceof File)) {
        Object.assign(acc, flatten(v, fullKey));
      } else {
        acc[fullKey] = v;
      }
      return acc;
    }, {} as Record<string, any>);

  const nestObject = (flat: Record<string, any>) => {
    const result: any = {};
    for (const [flatKey, value] of Object.entries(flat)) {
      const parts = flatKey.split(".");
      let cur = result;
      parts.forEach((p, i) => {
        if (i === parts.length - 1) cur[p] = value;
        else {
          cur[p] = cur[p] || {};
          cur = cur[p];
        }
      });
    }
    return result;
  };

  // Load existing for edit
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    apiClient.get(`/api/business?id=${editId}`)
      .then(res => {
        const data = stepKeys.reduce((acc, key) => { acc[key] = {}; return acc; }, {} as Record<StepKey, any>);
        stepKeys.forEach(key => {
          if (res.data[key]) {
            Object.assign(data[key], flatten(res.data[key], key));
          }
        });
        setFormData(data);
        setBusiness(res.data)
        setBusinessId(res.data._id);
        setMobileVerified(true);
      })
      .finally(() => setLoading(false));
  }, [editId]);

  // Fetch states
  useEffect(() => {
    setLoadingState(true);
    apiClient.get("/api/states")
      .then(r => setStateOptions(r.data.map((i:any) => ({ value: i.value, label: i.label }))))
      .finally(() => setLoadingState(false));
  }, []);

  // Fetch cities if country=INDIA
  const selectedCountry = formData.address["address.country"];
  const selectedState = formData.address["address.state"];
  useEffect(() => {
    if (selectedCountry === "INDIA" && selectedState) {
      setLoadingCity(true);
      apiClient.get(`/api/cities?state=${encodeURIComponent(selectedState)}`)
        .then(r => setCityOptions(r.data.cities.map((c: string) => ({ value: c, label: c }))))
        .finally(() => setLoadingCity(false));
    }
  }, [selectedCountry, selectedState]);

  // OTP countdown
  useEffect(() => {
    if (otpSent && !mobileVerified && !isTimerOver) {
      const iv = setInterval(() => 
        setTimer(t => (t > 1 ? t - 1 : (clearInterval(iv), setIsTimerOver(true), 0)))
      , 1000);
      return () => clearInterval(iv);
    }
  }, [otpSent, mobileVerified, isTimerOver]);

  // OTP handlers
  const handleRequestOtp = async () => {
    const phone = formData.basic["basic.phone"];
    if (!/^\+91\d{10}$/.test(phone)) {
      setOtpError("Wrong format: must be +91 followed by 10 digits");
      return;
    }
    setSendingOtp(true); setOtpError("");
    try { await apiClient.post("/api/request-otp", { phoneNumber: phone }); setOtpSent(true); }
    catch { setOtpError("Failed to send OTP"); }
    finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue) { setOtpError("Enter OTP"); return; }
    setVerifyingOtp(true); setOtpError("");
    try { 
      await apiClient.post("/api/verify-otp", { phoneNumber: formData.basic["basic.phone"], otp: otpValue });
      setMobileVerified(true);
    } catch {
      setOtpError("OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // File upload
  const handleFileUpload = async (file: File, name: string, setFieldValue: (f:string,v:any)=>void, folderName?: string) => {
    setUploading(true);
    try {
      const { data } = await apiClient.post("/api/auth/sign_s3", { fileName: file.name, fileType: file.type, folderName: folderName||name });
      await fetch(data.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setFieldValue(name, data.fileURL);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Input change
  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, type, value, checked, files } = e.target;
    const key = stepKeys[currentStep];
    let v: any;
    const def = b2bFields.find(f => f.name === name);
    if (type === "checkbox" && def?.type === "multi-select") {
      const arr = formData[key][name]||[];
      v = checked ? [...arr, value] : arr.filter((x:string)=>x!==value);
    } else if (type === "file" && files) {
      v = files[0];
    } else {
      v = value;
    }
    setFormData(f => ({ ...f, [key]: { ...f[key], [name]: v } }));
  };

  // Submit one step
  const handleSubmitStep = async () => {
    setStepError(""); setSubmittingStep(true);
    const key = stepKeys[currentStep];
    let payload: any;
    if (key === "remarks") {
      payload = {
        remarks: {
          ...nestObject(formData[key]).remarks,
          relationshipManager: employeeId ,
        }
      };
    } else {
      payload = nestObject(formData[key]);
    }
    try {
      if (!businessId) {
        const res = await apiClient.post("/api/business", payload);
        setBusinessId(res.data.id);
      } else {
        await apiClient.put(`/api/business?id=${businessId}`, payload);
      }
      if (currentStep < stepKeys.length-1) {
        setCurrentStep(s=>s+1);
      } else {
        router.push("/leadSystem/b2b");
      }
    } catch (err:any) {
      setStepError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmittingStep(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <button className="text-blue-500 underline mb-4" onClick={()=>router.back()}>Back</button>
      <div className="bg-white shadow-md rounded p-6 mb-6">
        {/* Progress */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-red-600" style={{ width: `${((currentStep+1)/stepKeys.length)*100}%` }} />
          </div>
          <div className="flex justify-between text-sm mt-1">
            {stepLabels.map((lbl,i)=>(
              <span key={i} className={i===currentStep?"font-bold":"text-gray-700"}>{i+1}. {lbl}</span>
            ))}
          </div>
        </div>

        <form ref={formRef} onSubmit={e=>{ e.preventDefault(); handleSubmitStep(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {b2bFields
              .filter(f=>f.name.startsWith(`${stepKeys[currentStep]}.`))
              .map(field => {
                const val = formData[stepKeys[currentStep]][field.name]||"";
                const req = field.required;
                switch (field.type) {
                  case "select": {
                    const opts = field.name==="address.state"
                      ? stateOptions
                      : field.name==="address.city"
                        ? cityOptions
                        : field.options;
                    const loading = field.name==="address.state"
                      ? loadingState
                      : field.name==="address.city"
                        ? loadingCity
                        : false;
                    return (
                      <div key={field.name} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}{req&&<span className="text-red-600">*</span>}
                        </label>
                        {loading ? (
                          <div>Loading...</div>
                        ) : (
                          <select
                            id={field.name}
                            name={field.name}
                            value={val}
                            onChange={handleChange}
                            required={req}
                            className="shadow border rounded w-full py-2 px-3 focus:outline-none"
                          >
                            <option value="">Select {field.label}</option>
                            {/* @ts-ignore */}
                            {opts.map((o:Option)=><option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  }
                  case "multi-select": {
                    const arr: string[] = formData[stepKeys[currentStep]][field.name] || [];
                    return (
                      <div key={field.name} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}{req&&<span className="text-red-600">*</span>}
                        </label>
                        <div className="flex flex-wrap">
                          {/* @ts-ignore */}
                          {field.options.map((o:Option)=>(
                            <label key={o.value} className="mr-3">
                              <input
                                type="checkbox"
                                name={field.name}
                                value={o.value}
                                checked={arr.includes(o.value)}
                                onChange={handleChange}
                                className="mr-1"
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  case "textarea":
                    return (
                      <div key={field.name} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}{req&&<span className="text-red-600">*</span>}
                        </label>
                        <textarea
                          id={field.name}
                          name={field.name}
                          rows={4}
                          value={val}
                          onChange={handleChange}
                          required={req}
                          className="shadow border rounded w-full py-2 px-3 focus:outline-none"
                        />
                      </div>
                    );
                  case "file":
                    return (
                      <div key={field.name} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}{req&&<span className="text-red-600">*</span>}
                        </label>
                        {val && (
                          <div className="mb-2">
                            <FontAwesomeIcon
                              icon={faEye}
                              className="cursor-pointer"
                              onClick={() => window.open(val, "_blank")}
                            />
                          </div>
                        )}
                        <input
                          type="file"
                          id={field.name}
                          name={field.name}
                          accept={field.accept}
                          disabled={uploading}
                          onChange={e => {
                            if (!e.target.files) return;
                            handleFileUpload(
                              e.target.files[0],
                              field.name,
                              (name, url) =>
                                setFormData(f => ({
                                  ...f,
                                  [stepKeys[currentStep]]: {
                                    ...f[stepKeys[currentStep]],
                                    [name]: url,
                                  },
                                })),
                              field.folder
                            );
                          }}
                          className="shadow border rounded w-full py-2 px-3 focus:outline-none"
                        />
                      </div>
                    );
                  case "mobile": {
                    const key = stepKeys[currentStep];
                    const fieldName = field.name; // e.g. "basic.phone"

                    // Extract the current stored full value (including country code)
                    const fullValue: string = formData[key][fieldName] || "";
                    // Remove the current countryCode prefix to get the raw number
                    const rawValue = fullValue.replace(new RegExp(`^\\${countryCode}`), "");

                    return (
                      <div key={fieldName} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}
                          {req && <span className="text-red-600">*</span>}
                        </label>

                        <div className="flex">
                          {/* Country code dropdown */}
                          <select
                            value={countryCode}
                            onChange={e => {
                              const newCode = e.target.value;
                              setCountryCode(newCode);
                              // Update formData so it contains the new code + the existing rawValue
                              setFormData(prev => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  [fieldName]: newCode + rawValue,
                                },
                              }));
                            }}
                            className="border rounded-l px-3 py-2 bg-white text-gray-700 focus:outline-none"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            {/* Add additional country codes here */}
                          </select>

                          {/* Mobile number input (raw digits only) */}
                          <input
                            type="text"
                            id={fieldName}
                            name={fieldName}
                            value={rawValue}
                            onChange={e => {
                              // Strip non-digit characters
                              const digits = e.target.value.replace(/\D/g, "");
                              // Combine with current country code
                              const combined = countryCode + digits;
                              // Write the combined value back into formData
                              setFormData(prev => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  [fieldName]: combined,
                                },
                              }));
                            }}
                            required={req}
                            className="shadow border-t border-r border-b rounded-r w-full py-2 px-3 focus:outline-none"
                            placeholder="Mobile number without country code"
                          />
                        </div>

                        {/* OTP verification controls */}
                        {!otpSent ? (
                          <button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={sendingOtp}
                            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            {sendingOtp ? "Sending..." : "Verify Mobile"}
                          </button>
                        ) : !mobileVerified ? (
                          <>
                            <div className="mt-2 flex items-center space-x-2">
                              <input
                                type="text"
                                value={otpValue}
                                onChange={e => setOtpValue(e.target.value)}
                                placeholder="OTP"
                                className="shadow border rounded py-1 px-2 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifyingOtp}
                                className="bg-green-600 text-white px-3 py-1 rounded"
                              >
                                {verifyingOtp ? "Verifying..." : "Submit OTP"}
                              </button>
                            </div>
                            {!isTimerOver ? (
                              <p className="text-sm text-gray-600 mt-1">Retry in {timer}s</p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false);
                                  setTimer(120);
                                  setIsTimerOver(false);
                                }}
                                className="text-blue-600 underline text-sm mt-1"
                              >
                                Resend OTP
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-green-600 font-bold mt-2 block">✓ Verified</span>
                        )}
                        {otpError && <p className="text-red-600 text-sm mt-1">{otpError}</p>}
                      </div>
                    );
                  }
                  default:
                    return (
                      <div key={field.name} className="mb-4">
                        <label className="block font-bold mb-1">
                          {field.label}{req&&<span className="text-red-600">*</span>}
                        </label>
                        <input
                          type={field.type}
                          id={field.name}
                          name={field.name}
                          value={val}
                          onChange={handleChange}
                          required={req}
                          className="shadow border rounded w-full py-2 px-3 focus:outline-none"
                        />
                      </div>
                    );
                }
              })}
          </div>
          {stepError && <p className="text-red-600 mt-2">{stepError}</p>}
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCurrentStep(s => Math.max(s-1,0))}
              disabled={currentStep===0}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submittingStep}
              className={`px-4 py-2 rounded text-white ${
                currentStep<stepKeys.length-1 ? "bg-blue-600" : "bg-green-600"
              } disabled:opacity-50`}
            >
              {submittingStep
                ? currentStep<stepKeys.length-1 ? "Saving..." : "Submitting..."
                : currentStep<stepKeys.length-1 ? "Next" : "Submit"
              }
            </button>
          </div>
        </form>
      </div>
      {isModalOpen && (
        <ReminderModal
          type="business"
          selectedItem={business}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
const B2BBusinessAddPage = () => (
  <Suspense fallback={<Loader />}>
    <B2BBusinessPageContent />
  </Suspense>
);

export default B2BBusinessAddPage;