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
import Select, {
  MultiValue,
  MultiValueRemoveProps,
  components
} from "react-select";

const admissionOptions = [
  "10TH MARKSHEET",
  "10TH CERTIFICATE",
  "10TH ADMIT CARD",
  "12TH MARKSHEET",
  "12TH CERTIFICATE",
  "SECONDARY-SCHOOL LEAVING CERTIFICATE",
  "12TH ADMIT CARD",
  "NEET QUALIFIED",
  "PASSPORT",
  "AADHAR CARD",
  "LETTER OF RECOMMENDATION (MIN 3)",
  "JEE MAIN/ADVANCED (IF QUALIFIED)",
  "EXTRACURRICULAR CERTIFICATE",
  "INTERNSHIP CERTIFICATE",
  "EXPERIENCE LETTER",
  "TESTAS (MIN MARKS 110)",
  "IELTS",
  "UG Degree/Certificate",
  "UG Semester Certificate",
  "UG Transcript",
  "UG College Leaving Certificate",
  "SAT/ACT",
  "Tuberculosis Tests Result",
  "Medical Certificate",
  "Police Clearance Certificate",
  "CISIA",
  "LOM",
  "CV"
];

// durations 1, 1.5, …, 6
const durationOptions = Array.from({ length: 11 }, (_, i) => 1 + i * 0.5).map(
  (v) => ({ label: `${v}`, value: `${v}` })
);

export default function CollegeAddPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CollegeForm />
    </Suspense>
  );
}

function CollegeForm() {
  const router = useRouter();
  const { collegeId } = useParams() as { collegeId: string };
  const courseId = useSearchParams().get("courseId");
  const [loading, setLoading] = useState(false);
  const [streamOptions, setStreamOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [languageOptions, setLanguageOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [areaOptions, setAreaOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [admReqOptions, setAdmReqOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [newStream, setNewStream] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newAdmReq, setNewAdmReq] = useState("");

  const methods = useForm({
    defaultValues: {
      area: "", area_publish: true,
      degree: "", degree_publish: true,
      name: "", name_publish: true,
      credit: [] as string[], credit_publish: true,
      duration: [] as string[], duration_publish: true,
      intakes: [] as Array<{ month: string; deadlineDay: string; deadlineMonth: string }>,
      intakes_publish: true,
      applicationFee: "", applicationFee_publish: true,
      branches: [] as Array<{
        location: string;
        totalFeePerYear: string;
        totalCourseFee: string;
        enrollmentFee: string;
      }>,
      branches_publish: true,
      language: [] as string[], language_publish: true,
      languageReq: "", languageReq_publish: false,
      admissionDoc: [] as string[], admissionDoc_publish: true,
      admissionEligibility: [] as string[], admissionEligibility_publish: false,
      financialRequirement: "", financialRequirement_publish: true,
      futureCareer: "", futureCareer_publish: true,
      avgCtc: "", avgCtc_publish: true,
      scholarship: "", scholarship_publish: true,
      semester: [] as string[], semester_publish: false,
      criteria: "", criteria_publish: false,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = methods;

  const intakes = useFieldArray({ control, name: "intakes" });
  const branches = useFieldArray({ control, name: "branches" });
  //@ts-ignore
  const semesters = useFieldArray<string>({ control, name: "semester" });

  const semValues = watch("semester");

  useEffect(() => {
    // fetch lookup lists
    apiClient.get<string[]>("/api/college/streams").then((r) =>
      setAreaOptions(r.data.map((s) => ({ label: s, value: s })))
    );
    apiClient.get<string[]>("/api/college/courses").then((r) =>
      setStreamOptions(r.data.map((s) => ({ label: s, value: s })))
    );
    apiClient.get<string[]>("/api/college/languages").then((r) =>
      setLanguageOptions(r.data.map((l) => ({ label: l, value: l })))
    );
    apiClient.get<string[]>("/api/college/admReqs").then((r) =>
      setAdmReqOptions(r.data.map((l) => ({ label: l, value: l })))
    );

    if (!courseId) return;
    setLoading(true);
    apiClient
      .get(`/api/college/${collegeId}/course?courseId=${courseId}`)
      .then((r) => {
        const c = r.data.course;
        // intakes: split deadline
        const intakeEntries = (c.intakes || []).map((x: any) => {
          const [yyyy, mm, dd] = x.deadline.split("-");
          return { month: x.month, deadlineDay: dd, deadlineMonth: mm };
        });
        // branches if any
        const branchEntries = (c.branches || []).map((b: any) => ({
          location: b.location,
          totalFeePerYear: (b.totalFeePerYear || ""),
          totalCourseFee: (b.totalCourseFee || ""),
          enrollmentFee: (b.enrollmentFee || ""),
        }));

        const base = { ...c };
        delete (base as any).intakes;
        delete (base as any).branches;

        reset({
          ...base,
          intakes: intakeEntries,
          branches: branchEntries,
        });
      })
      .finally(() => setLoading(false));
  }, [collegeId, courseId, reset]);

  const onSubmit = async (data: any) => {
    // reconstruct deadline
    data.intakes = data.intakes.map((x: any) => ({
      month: x.month,
      deadline: `xxxx-${x.deadlineMonth}-${x.deadlineDay}`,
    }));

    // flatten branches
    data.branches = data.branches.map((b: any) => ({
      location: b.location,
      totalFeePerYear: (b.totalFeePerYear || ""),
      totalCourseFee: (b.totalCourseFee || ""),
      enrollmentFee: (b.enrollmentFee || ""),
    }));

    const method = courseId ? "PUT" : "POST";
    await fetch(`/api/college/${collegeId}/course`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.push(`/leadSystem/college/${collegeId}`);
  };

  // helpers to add / delete from lookups
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
    setValue(fieldKey as any, list === languageOptions ? [...watch("language"), newVal] : newVal);
    setNewArea("");
    setNewStream("");
    setNewAdmReq("");
    setNewLanguage("");
  };
  const deleteLookup = async (
    endpoint: string,
    list: { label: string; value: string }[],
    setter: (v: { label: string; value: string }[]) => void,
    val: string,
    fieldKey: keyof typeof methods.reset
  ) => {
    if (!val) return;
    // show a confirm modal before deleting:
    const ok = window.confirm(`Are you sure you want to delete “${val}”?`);
    if (!ok) return;

    try {
      await apiClient.delete(`${endpoint}?name=${encodeURIComponent(val)}`);
      const updated = list.filter((o) => o.value !== val);
      setter(updated);
      // if current form value equals the deleted value, clear it:
      if (watch(fieldKey as any) === val) {
        setValue(fieldKey as any, "");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto p-4">
        <button
          className="underline text-blue-500 mb-4"
          onClick={() => router.back()}
        >
          Back
        </button>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 bg-white p-6 rounded"
        >
          {/* 1. Subject Area */}
          <Section label="Subject Area (stream)" publish="area_publish">
            <Controller
              name="area"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  {...field}
                  options={areaOptions}
                  placeholder="Select or search…"
                  onDelete={(v) =>
                    deleteLookup(
                      "/api/college/streams",
                      areaOptions,
                      setAreaOptions,
                      v, 
                      //@ts-ignore        
                      "area"   
                    )
                  } />
              )}
            />
            <div className="flex gap-2 mt-2">
              <input
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Add new area"
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addLookup(
                    "/api/college/streams",
                    areaOptions,
                    setAreaOptions,
                    newArea,
                    // @ts-ignore
                    "area"
                  )
                }
                disabled={!newArea.trim()}
                className={`bg-deepblue text-white px-4 rounded ${
                  !newArea.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add
              </button>
            </div>
          </Section>
          <Section label="Criteria" publish="criteria_publish">
            <select
              {...register("criteria", { required: "Please select a criteria" })}
              className="w-full border p-2 rounded"
            >
              <option value="" disabled>
                Select
              </option>
              <option>UG</option>
              <option>PG</option>
              <option>MBA</option>
              <option>MEDICINE</option>
            </select>
          </Section>

          {/* 2. Degree */}
          <Section label="Degree" publish="degree_publish">
            <select {...register("degree")} className="w-full border p-2 rounded">
              <option value="">Select</option>
              <option>UG</option>
              <option>PG</option>
              <option>MBA</option>
              <option>PHD</option>
              <option>DIPLOMA</option>
            </select>
          </Section>

          {/* 3. Course Name */}
          <Section label="Course Name" publish="name_publish">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  {...field}
                  options={streamOptions}
                  placeholder="Select or search…"
                  onDelete={(v) =>
                    deleteLookup(
                      "/api/college/courses",
                      streamOptions,
                      setStreamOptions,
                      v, 
                      //@ts-ignore        
                      "name"   
                    )
                  }    
                />
              )}
            />
            <div className="flex gap-2 mt-2">
              <input
                value={newStream}
                onChange={(e) => setNewStream(e.target.value)}
                placeholder="Add new course"
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addLookup(
                    "/api/college/courses",
                    streamOptions,
                    setStreamOptions,
                    newStream,
                    // @ts-ignore
                    "name"
                  )
                }
                disabled={!newStream.trim()}
                className={`bg-deepblue text-white px-4 rounded ${
                  !newStream.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add
              </button>
            </div>
          </Section>

          {/* 4. Credits */}
          <Section label="Credits (ECTS)" publish="credit_publish">
            <Controller
              name="credit"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    //@ts-ignore
                    { label: "60", value: "60" },{ label: "90", value: "90" },{ label: "120", value: "120" },{ label: "180", value: "180" },{ label: "210", value: "210" },{ label: "240", value: "270" }, { label: "300", value: "300" }, { label: "360", value: "300" }
                  ]}
                  isMulti
                  closeMenuOnSelect={false}
                  classNamePrefix="react-select"
                  placeholder="Select credits…"
                />
              )}
            />
          </Section>

          {/* 5. Duration */}
          <Section label="Duration (years)" publish="duration_publish">
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  //@ts-ignore
                  options={durationOptions}
                  isMulti
                  closeMenuOnSelect={false}
                  classNamePrefix="react-select"
                  placeholder="Select durations…"
                />
              )}
            />
          </Section>

          {/* 6. Intakes & Deadlines */}
          <Section label="Intake Months & Deadlines" publish="intakes_publish">
            {intakes.fields.map((fld, idx) => (
              <div key={fld.id} className="flex gap-2 mb-2">
                {/* Intake Month Dropdown */}
                <select
                  {...register(`intakes.${idx}.month` as const)}
                  className="border p-2 rounded flex-1"
                >
                  <option value="">Month</option>
                  {[
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ].map((m) => (
                    <option key={m} value={m.toUpperCase()}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Deadline Day (DD) */}
                <input
                  {...register(`intakes.${idx}.deadlineDay` as const)}
                  placeholder="DD"
                  maxLength={2}
                  className="w-1/4 border p-2 rounded"
                />

                {/* Deadline Month Dropdown */}
                <select
                  {...register(`intakes.${idx}.deadlineMonth` as const)}
                  className="w-3/5 border p-2 rounded"
                >
                  <option value="">Month</option>
                  {[
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"
                  ].map((m) => (
                    <option key={m} value={m.toUpperCase()}>
                      {m}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => intakes.remove(idx)}
                  className="text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                intakes.append({ month: "", deadlineDay: "", deadlineMonth: "" })
              }
              className="bg-deepblue text-white px-4 py-2 rounded"
            >
              Add Intake
            </button>
          </Section>


          {/* 7. Application Fee */}
          <Section label="Application Fee" publish="applicationFee_publish">
            <input
              {...register("applicationFee")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 8. Branch Locations & Fees */}
          <Section label="Branch Locations & Fees" publish="branches_publish">
            <Controller
              name="branches"
              control={control}
              //@ts-ignore
              render={() => null /* we use FieldArray below */}
            />
            {branches.fields.map((b, i) => (
              <div key={b.id} className="border p-4 rounded mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    {...register(`branches.${i}.location` as const)}
                    placeholder="Branch Location"
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => branches.remove(i)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    {...register(`branches.${i}.totalFeePerYear` as const)}
                    placeholder="Total Fee / Year"
                    className="flex-1 border p-2 rounded"
                  />
                  <input
                    {...register(`branches.${i}.totalCourseFee` as const)}
                    placeholder="Total Course Fee"
                    className="flex-1 border p-2 rounded"
                  />
                  <input
                    {...register(`branches.${i}.enrollmentFee` as const)}
                    placeholder="Enrollment Fee"
                    className="flex-1 border p-2 rounded"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                branches.append({
                  location: "",
                  totalFeePerYear: "",
                  totalCourseFee: "",
                  enrollmentFee: "",
                })
              }
              className="bg-deepblue text-white px-4 py-2 rounded"
            >
              + Add Branch
            </button>
          </Section>

          {/* 9. Course Language */}
          <Section label="Course Language" publish="language_publish">
            <Controller
              name="language"
              control={control}
              render={({ field: { value = [], onChange, ref } }) => (
                <Select
                  //@ts-ignore
                  inputRef={ref}
                  options={languageOptions}
                  isMulti
                  closeMenuOnSelect={false}
                  classNamePrefix="react-select"
                  placeholder="Select languages..."
                  value={languageOptions.filter(opt => value.includes(opt.value))}
                  onChange={(selected: any) => onChange(selected.map((o: any) => o.value))}
                  components={{
                    Option: (props: any) => {
                      const val = props.data.value;
                      return (
                        <components.Option {...props}>
                          <span className="flex-1">{props.data.label}</span>
                          <button
                            type="button"
                            onClick={async e => {
                              e.stopPropagation();
                              await deleteLookup(
                                "/api/college/languages",
                                languageOptions,
                                setLanguageOptions,
                                val,
                                //@ts-ignore
                                "language"
                              );
                            }}
                            className="text-red-500 ml-2 hover:text-red-700"
                          >
                            ×
                          </button>
                        </components.Option>
                      );
                    },
                    MultiValueRemove: (props: any) => {
                      const val = props.data.value;
                      return (
                        <components.MultiValueRemove {...props}>
                          <span
                            onClick={async e => {
                              onChange((value || []).filter((v: string) => v !== val));
                            }}
                          >
                            ×
                          </span>
                        </components.MultiValueRemove>
                      );
                    }
                  }}
                  
                />
              )}
            />

            {/* Add-new input + button */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                placeholder="Add new language"
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addLookup(
                    "/api/college/languages",
                    languageOptions,
                    setLanguageOptions,
                    newLanguage,
                    // @ts-ignore
                    "language"
                  )
                }
                disabled={!newLanguage.trim()}
                className={`bg-deepblue text-white px-4 rounded ${
                  !newLanguage.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add
              </button>
            </div>
          </Section>


          {/* 10. Language Requirement */}
          <Section label="Course Language Requirement" publish="languageReq_publish">
            <input
              {...register("languageReq")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 11. Admission Documents */}
          <Section label="Admission Document" publish="admissionDoc_publish">
            <Controller
              name="admissionDoc"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={admissionOptions.map((s) => ({ label: s, value: s }))}
                  isMulti
                  closeMenuOnSelect={false}
                  classNamePrefix="react-select"
                  placeholder="Select admission docs..."
                  onChange={(vals) =>
                    field.onChange(vals.map((v: any) => v.value))
                  }
                  value={admissionOptions
                    .map((s) => ({ label: s, value: s }))
                    .filter((o) => field.value?.includes(o.value))}
                />
              )}
            />
          </Section>

          {/* 12. Admission Eligibility Requirements */}
          <Section
            label="Admission Eligibility Requirements"
            publish="admissionEligibility_publish"
          >
            <Controller
              name="admissionEligibility"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  {...field}
                  options={admReqOptions}
                  placeholder="Select or search…"
                  onDelete={(v) =>
                    deleteLookup(
                      "/api/college/admReqs",
                      admReqOptions,
                      setAdmReqOptions,
                      v, 
                      //@ts-ignore        
                      "admissionEligibility"   
                    )
                  }  
                />
              )}
            />
            <div className="flex gap-2 mt-2">
              <input
                value={newAdmReq}
                onChange={(e) => setNewAdmReq(e.target.value)}
                placeholder="Add new eligibility requirement"
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addLookup(
                    "/api/college/admReqs",
                    admReqOptions,
                    setAdmReqOptions,
                    newAdmReq,
                    //@ts-ignore
                    "admissionEligibility"
                  )
                }
                disabled={!newAdmReq.trim()}
                className={`bg-deepblue text-white px-4 rounded ${
                  !newAdmReq.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add
              </button>
            </div>
          </Section>

          {/* 16. Financial Requirement */}
          <Section
            label="Financial Requirement"
            publish="financialRequirement_publish"
          >
            <input
              {...register("financialRequirement")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 17. Your Future Career */}
          <Section label="Your Future Career" publish="futureCareer_publish">
            <input
              {...register("futureCareer")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 18. Average CTC */}
          <Section label="Average CTC" publish="avgCtc_publish">
            <input
              {...register("avgCtc")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 19. Scholarship */}
          <Section label="Scholarship" publish="scholarship_publish">
            <input
              {...register("scholarship")}
              type="text"
              className="w-full border p-2 rounded"
            />
          </Section>

          {/* 20. Semester Fees */}
          <Section label="Semester Fees" publish="semester_publish">
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
          </Section>

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

function Section({
  label,
  publish,
  children,
}: {
  label: string;
  publish: string;
  children: React.ReactNode;
}) {
  const { register } = useFormContext();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" {...register(publish)} />
          <span>Publish</span>
        </label>
      </div>
      <div>{children}</div>
    </div>
  );
}
