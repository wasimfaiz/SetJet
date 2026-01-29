// app/college/[collegeId]/course/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  useForm,
  FormProvider,
  useFieldArray,
  Controller,
  useFormContext,
} from "react-hook-form";
import SearchableSelect from "@/app/components/searchableSelect";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import Select from "react-select";

const admissionOptions = [
  { label: "10TH MARKSHEET", value: "10TH MARKSHEET" },
  { label: "10TH CERTIFICATE", value: "10TH CERTIFICATE" },
  { label: "10TH ADMIT CARD", value: "10TH ADMIT CARD" },
  { label: "12TH MARKSHEET", value: "12TH MARKSHEET" },
  { label: "12TH CERTIFICATE", value: "12TH CERTIFICATE" },
  { label: "SECONDARY-SCHOOL LEAVING CERTIFICATE", value: "SECONDARY-SCHOOL LEAVING CERTIFICATE" },
  { label: "12TH ADMIT CARD", value: "12TH ADMIT CARD" },
  { label: "NEET QUALIFIED", value: "NEET QUALIFIED" },
  { label: "PASSPORT", value: "PASSPORT" },
  { label: "AADHAR CARD", value: "AADHAR CARD" },
  { label: "LETTER OF RECOMMENDATION (MIN 3)", value: "LETTER OF RECOMMENDATION (MIN 3)" },
  { label: "JEE MAIN/ADVANCED (IF QUALIFIED)", value: "JEE MAIN/ADVANCED (IF QUALIFIED)" },
  { label: "EXTRACURRICULAR CERTIFICATE", value: "EXTRACURRICULAR CERTIFICATE" },
  { label: "INTERNSHIP CERTIFICATE", value: "INTERNSHIP CERTIFICATE" },
  { label: "EXPERIENCE LETTER", value: "EXPERIENCE LETTER" },
];

// Helper: generate durations 1,1.5,…,6
const durationOptions = Array.from({ length: 11 }, (_, i) => 1 + 0.5 * i).map((v) => ({
  label: `${v}`, value: `${v}`,
}));

export default function CollegeAddPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CollegeAddPageContent />
    </Suspense>
  );
}

function CollegeAddPageContent() {
  const router = useRouter();
  const { collegeId } = useParams() as { collegeId: string };
  const courseId = useSearchParams().get("courseId");
  const [loading, setLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState<{ label: string; value: string }[]>([]);
  const [newCourseName, setNewCourseName] = useState("");

  // ------ form setup ------
  const methods = useForm({
    defaultValues: {
      // everything + publish flags
      name: "", name_publish: false,
      admissionEligibility: "", admissionEligibility_publish: false,
      applicationDate: "", applicationDate_publish: false,
      criteria: "", criteria_publish: false,
      duration: "", duration_publish: false,
      applicationFee: "", applicationFee_publish: false,
      admissionCharges: "", admissionCharges_publish: false,
      erpFeePerYear: "", erpFeePerYear_publish: false,
      libraryMedicalFee: "", libraryMedicalFee_publish: false,
      internalExamFee: "", internalExamFee_publish: false,
      tuitionFeePerYear: "", tuitionFeePerYear_publish: false,
      totalFeePerYear: "", totalFeePerYear_publish: false,
      registrationFee: "", registrationFee_publish: false,
      academicFee: "", academicFee_publish: false,
      softSkills: "", softSkills_publish: false,
      unitFee: "", unitFee_publish: false,
      totalFeeFullCourse: "", totalFeeFullCourse_publish: false,
      degree: "", degree_publish: false,
      languageReq: "", languageReq_publish: false,
      stream: "", stream_publish: false,
      admissionDoc: [] as string[], admissionDoc_publish: false,
      career: "", career_publish: false,
      intake: "", intake_publish: false,
      scholarship: "", scholarship_publish: false,
      avgCtc: "", avgCtc_publish: false,
      semester: [] as string[], semester_publish: false,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = methods;

  //@ts-ignore
  const semesters = useFieldArray<string>({ control, name: "semester" });

  // load courses & existing course (if editing)
  useEffect(() => {
    apiClient.get<string[]>("/api/college/courses").then((res) =>
      setCourseOptions(res.data.map((n) => ({ label: n, value: n })))
    );

    if (!courseId) return;
    setLoading(true);
    apiClient.get(`/api/college/${collegeId}/course?courseId=${courseId}`)
      .then((res) => {
        const c = res.data.course;
        const base = { ...c };
        reset({ ...base });
      })
      .finally(() => setLoading(false));
  }, [collegeId, courseId, reset]);

  const onSubmit = async (data: any) => {
    const method = courseId ? "PUT" : "POST";
    await fetch(`/api/college/${collegeId}/course`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data }),
    });
    router.push(`/leadSystem/college/${collegeId}`);
  };

  const deleteCourse = async (name: string) => {
    if (!confirm(`Delete course "${name}"?`)) return;
    await apiClient.delete(`/api/college/courses?name=${encodeURIComponent(name)}`);
    setCourseOptions((prev) => prev.filter((o) => o.value !== name));
  };
  const addLookup = async (
    endpoint: string,
    list: any[],
    setter: (v: any[]) => void,
    newVal: string,
    fieldKey: keyof typeof methods.reset
  ) => {
    if (!newVal.trim()) return;
    await apiClient.post(endpoint, { name: newVal });
    const opt = { label: newVal, value: newVal };
    setter([...list, opt]);
    setValue(fieldKey as any, newVal);
    setNewCourseName("");
  };
  if (loading) return <Loader />;

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto p-4">
        <button
          className="text-blue-500 underline mb-4"
          onClick={() => router.back()}
        >
          Back
        </button>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded"
        >
          {/* Course Name with Publish */}
          <FieldWithPublish label="Course Name" publishName="name_publish">
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Course Name is required' }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <SearchableSelect
                    options={courseOptions}
                    value={value}
                    onChange={onChange}
                    placeholder="Select or search..."
                    onDelete={deleteCourse}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-1">
                      {error.message}
                    </p>
                  )}
                </>
              )}
            />
            <div className="flex gap-2 mt-2">
              <input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Add new area"
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addLookup(
                    "/api/college/courses",
                    courseOptions,
                    setCourseOptions,
                    newCourseName,
                    // @ts-ignore
                    "name"
                  )
                }
                disabled={!newCourseName.trim()}
                className={`bg-deepblue text-white px-4 rounded ${
                  !newCourseName.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add
              </button>
            </div>
          </FieldWithPublish>

          {/* Eligibility */}
          <FieldWithPublish label="Admission Eligibility" publishName="admissionEligibility_publish">
            <input
              {...register("admissionEligibility")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Application Date */}
          <FieldWithPublish label="Application Date" publishName="applicationDate_publish">
            <input
              {...register("applicationDate")}
              type="date"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Criteria */}
          <FieldWithPublish label="Criteria" publishName="criteria_publish">
            <>
              <select
                {...register("criteria", { required: "Criteria is required" })}
                className="w-full border p-2 rounded"
              >
                <option value="">Select</option>
                {["UG", "PG", "MBA", "MEDICINE"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.criteria && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.criteria.message}
                </p>
              )}
            </>
          </FieldWithPublish>

          {/* Duration */}
          <FieldWithPublish label="Duration (yrs)" publishName="duration_publish">
            <select {...register("duration")} className="w-full border p-2 rounded">
              <option value="">Select</option>
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FieldWithPublish>

          {/* Application Fee */}
          <FieldWithPublish label="Application Fee" publishName="applicationFee_publish">
            <input
              {...register("applicationFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Admission Charges */}
          <FieldWithPublish label="Admission Charges" publishName="admissionCharges_publish">
            <input
              {...register("admissionCharges")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* ERP Fee */}
          <FieldWithPublish label="ERP Fee (Per Yr)" publishName="erpFeePerYear_publish">
            <input
              {...register("erpFeePerYear")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Library/Med Fee */}
          <FieldWithPublish label="Library/Medical Fee" publishName="libraryMedicalFee_publish">
            <input
              {...register("libraryMedicalFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Internal Exam Fee */}
          <FieldWithPublish label="Internal Exam Fee" publishName="internalExamFee_publish">
            <input
              {...register("internalExamFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Tuition Fee */}
          <FieldWithPublish label="Tuition Fee (Per Yr)" publishName="tuitionFeePerYear_publish">
            <input
              {...register("tuitionFeePerYear")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Total Fee / Yr */}
          <FieldWithPublish label="Total Fee (Per Yr)" publishName="totalFeePerYear_publish">
            <input
              {...register("totalFeePerYear")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Registration Fee */}
          <FieldWithPublish label="Registration Fee" publishName="registrationFee_publish">
            <input
              {...register("registrationFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Academic Fee */}
          <FieldWithPublish label="Academic Fee" publishName="academicFee_publish">
            <input
              {...register("academicFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Soft Skills */}
          <FieldWithPublish label="Soft Skills" publishName="softSkills_publish">
            <textarea
              {...register("softSkills")}
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Unit Fee */}
          <FieldWithPublish label="Unit Fee" publishName="unitFee_publish">
            <input
              {...register("unitFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Total Course Fee */}
          <FieldWithPublish label="Total Course Fee" publishName="totalFeeFullCourse_publish">
            <input
              {...register("totalFeeFullCourse")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Degree */}
          <FieldWithPublish label="Degree" publishName="degree_publish">
            <select {...register("degree")} className="w-full border p-2 rounded">
              <option value="">Select</option>
              {["UG","PG","PHD"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FieldWithPublish>

          {/* Stream */}
          <FieldWithPublish label="Stream" publishName="stream_publish">
            <>
              <select
                {...register("stream", { required: "Stream is required" })}
                className="w-full border p-2 rounded"
              >
                <option value="">Select</option>
                <option value="REQUIRED">Required</option>
                <option value="NOT REQUIRED">Not Required</option>
              </select>
              {errors.stream && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.stream.message}
                </p>
              )}
            </>
          </FieldWithPublish>

          {/* Admission Documents */}
          <FieldWithPublish label="Admission Documents" publishName="admissionDoc_publish">
            <Controller
              name="admissionDoc"
              control={control}
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  //@ts-ignore
                  inputRef={ref}
                  options={admissionOptions}
                  isMulti
                  classNamePrefix="react-select"
                  value={admissionOptions.filter((o) => value?.includes(o.value))}
                  onChange={(sel) => onChange(sel.map((o) => o.value))}
                />
              )}
            />
          </FieldWithPublish>

          {/* Career */}
          <FieldWithPublish label="Your Future Career" publishName="career_publish">
            <input
              {...register("career")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Scholarship */}
          <FieldWithPublish label="Scholarship" publishName="scholarship_publish">
            <input
              {...register("scholarship")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Average CTC */}
          <FieldWithPublish label="Average CTC" publishName="avgCtc_publish">
            <input
              {...register("avgCtc")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </FieldWithPublish>

          {/* Semester Fees */}
          <FieldWithPublish label="Semester Fees" publishName="semester_publish">
          {semesters.fields.map((_, i) => (
              <div key={semesters.fields[i].id} className="flex items-center gap-2 mb-2">
                <label className="w-1/6">Sem {i + 1}</label>
                <Controller
                  name={`semester.${i}`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      {...field}
                      placeholder="Amount"
                      className="border p-2 rounded flex-1"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => semesters.remove(i)}
                  className="text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              //@ts-ignore
              onClick={() => semesters.append("")}
              className="bg-deepblue text-white px-4 py-2 rounded"
            >
              Add Semester
            </button>
          </FieldWithPublish>

          {/* Submit */}
          <div className="col-span-full text-right">
            <button
              type="submit"
              className="bg-deepblue text-white px-6 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

// ------------------------------------------------------------------------
// small helper wrapper to avoid repeating label + publish checkbox
// ------------------------------------------------------------------------
function FieldWithPublish({
  label,
  publishName,
  children,
}: {
  label: string;
  publishName: string;
  children: React.ReactNode;
}) {
  // grabs register() from the nearest FormProvider
  const { register } = useFormContext();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" {...register(publishName)} />
          <span>Publish</span>
        </label>
      </div>
      {children}
    </div>
  );
}
