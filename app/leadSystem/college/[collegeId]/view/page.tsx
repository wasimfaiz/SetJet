// app/college/[collegeId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/app/components/loader";

const CollegeTable = () => {
  const { collegeId } = useParams();
  const router = useRouter();
  const [college, setCollege] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  // accordion state
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedSubCourse, setExpandedSubCourse] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollege = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/college?id=${collegeId}`);
        const data = await res.json();
        setCollege(data.colleges?.[0] || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCollege();
  }, [collegeId]);

  if (loading) return <Loader />;

  const allCourses = college.courses || [];
  const filteredCourses = allCourses.filter((c: any) =>
    (!courseFilter || c.name === courseFilter) &&
    (searchTerm === "" ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subcourses || []).some((sc: any) =>
        sc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const toggleCourse = (cid: string) =>
    setExpandedCourse(expandedCourse === cid ? null : cid);
  const toggleSubCourse = (scid: string) =>
    setExpandedSubCourse(expandedSubCourse === scid ? null : scid);

  function convertToSpaceSeparated(input: string) {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  return (
    <div className="container mx-auto p-4">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-6"
        onClick={() => router.back()}
      >
        Back
      </button>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search courses or subcourses…"
          className="border p-2 rounded-lg flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border p-2 rounded-lg"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {allCourses.map((c: any) => (
            <option key={c.courseId} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* College Header */}
      <div className="border rounded-lg p-4 shadow-sm bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            className="md:w-1/3 rounded"
            src={college?.img || "/university.png"}
            alt={`${college?.name} Logo`}
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {college?.name}
            </h2>
            <p className="text-sm text-gray-500">{college?.country}</p>
            <p className="text-sm text-gray-500">
              {college?.state}, {college?.city}
            </p>
          </div>
        </div>
      </div>

      {/* Courses Accordion */}
      <div className="space-y-6 mt-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course: any) => (
            <div key={course.courseId} className="space-y-4">
              <div
                className="p-4 border text-white bg-green-600 rounded-lg cursor-pointer flex justify-between"
                onClick={() => toggleCourse(course.courseId)}
              >
                <h3 className="text-lg font-medium">{course.name}</h3>
                <span>{expandedCourse === course.courseId ? "▼" : "▶"}</span>
              </div>

              {expandedCourse === course.courseId && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <table className="w-full text-left border-collapse">
                  <tbody>
                    {/* 1. Area */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.area_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Area{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.area || "-"}</td>
                    </tr>

                    {/* 2. Application Date */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.applicationDate_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Application Date{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {course.applicationDate ? new Date(course.applicationDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>

                    {/* 3. Criteria */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.criteria_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Criteria{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.criteria || "-"}</td>
                    </tr>

                    {/* 4. Duration */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.duration_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Duration (years) {" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {(Array.isArray(course.duration) && course.duration.map((d: any) => d.label).join(", ")) ||
                        course.duration ||
                        "-"}
                      </td>
                    </tr>

                    {/* 5. Credits */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.credit_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Credits (ECTS){" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {(Array.isArray(course.credit) && course.credit.map((c: any) => c.label).join(", ")) ||
                        course.credit ||
                        "-"}
                      </td>
                    </tr>

                    {/* 6. Intake Months & Deadlines */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.intakes_publish && (
                          <span
                            className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 "
                            title="Published"
                          />
                        )}
                        Intake Months & Deadlines{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.intakes) && course.intakes.length > 0 ? (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border-b p-1 text-left">Month</th>
                                <th className="border-b p-1 text-left">Deadline</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.intakes.map((i: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="border-b p-1">{i.month}</td>
                                  <td className="border-b p-1">
                                    {`${i.deadline.slice(9)} ${i.deadline.slice(5, 8)}`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>

                    {/* 7. Application Fee */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.applicationFee_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Application Fee{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.applicationFee || "-"}</td>
                    </tr>

                    {/* 8. Branches (with fees) */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.branches_publish && (
                          <span
                            className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 "
                            title="Published"
                          />
                        )}
                        Branch Locations{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.branches) && course.branches.length > 0 ? (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border-b p-1 text-left">Location</th>
                                <th className="border-b p-1 text-left">Total Fee / Yr</th>
                                <th className="border-b p-1 text-left">Total Course Fee</th>
                                <th className="border-b p-1 text-left">Enrollment Fee</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.branches.map((b: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="border-b p-1">{b.location || "-"}</td>
                                  <td className="border-b p-1">{b.totalFeePerYear ?? "-"}</td>
                                  <td className="border-b p-1">{b.totalCourseFee ?? "-"}</td>
                                  <td className="border-b p-1">{b.enrollmentFee ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>

                    {/* 9. Language */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.language_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Course Language{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.language) ? course.language.join(", ") : "-"}
                      </td>
                    </tr>

                    {/* 10. Language Requirement */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.languageReq_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Course Language Requirement{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.languageReq || "-"}</td>
                    </tr>

                    {/* 11. Admission Documents */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.admissionDoc_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Admission Documents{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.admissionDoc)
                          ? course.admissionDoc.map((d: any) => d.label || d).join(", ")
                          : "-"}
                      </td>
                    </tr>

                    {/* 12. Admission Eligibility */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.admissionEligibility_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Admission Eligibility Requirements{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.admissionEligibility)
                          ? course.admissionEligibility.join(", ")
                          : course.admissionEligibility || "-"}
                      </td>
                    </tr>

                    {/* 13. Financial Requirement */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.financialRequirement_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Financial Requirement{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.financialRequirement || "-"}</td>
                    </tr>

                    {/* 14. Future Career */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.futureCareer_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Your Future Career{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.futureCareer || "-"}</td>
                    </tr>

                    {/* 15. Average CTC */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.avgCtc_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Average CTC{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.avgCtc || "-"}</td>
                    </tr>

                    {/* 16. Scholarship */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.scholarship_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Scholarship{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">{course.scholarship || "-"}</td>
                    </tr>

                    {/* 17. Semester Fees */}
                    <tr>
                      <td className="border-b p-2 font-medium text-gray-700">
                        {course.semester_publish && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 " title="Published" />
                        )}
                        Semester Fees{" "}
                      </td>
                      <td className="border-b p-2 text-gray-600">
                        {Array.isArray(course.semester) && course.semester.length > 0
                          ? course.semester
                              .map((amt: string, idx: number) => `Sem ${idx + 1}: ${amt}`)
                              .join(", ")
                          : "-"}
                      </td>
                    </tr>
                  </tbody>

                  </table>

                  {Array.isArray(course.subcourses) && course.subcourses.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {course.subcourses.map((sc: any) => (
                        <div key={sc.subCourseId} className="space-y-2">
                          <div
                            className="p-3 border bg-gray-200 rounded-lg cursor-pointer flex justify-between"
                            onClick={() => toggleSubCourse(sc.subCourseId)}
                          >
                            <h4 className="font-medium">{sc.name}</h4>
                            <span>
                              {expandedSubCourse === sc.subCourseId
                                ? "▼"
                                : "▶"}
                            </span>
                          </div>

                          {expandedSubCourse === sc.subCourseId && (
                            <div className="p-3 bg-white rounded-lg">
                              <table className="w-full text-left border-collapse">
                                <tbody>
                                  {Object.entries(sc)
                                    .filter(
                                      ([k]) =>
                                        !["subCourseId", "name"].includes(k)
                                    )
                                    .map(([k, v]) => (
                                      <tr key={k}>
                                        <td className="border-b p-2 font-medium text-gray-700 capitalize">
                                          {convertToSpaceSeparated(k)}
                                        </td>
                                        <td className="border-b p-2 text-gray-600">
                                          {v as string}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No courses match.</p>
        )}
      </div>
    </div>
  );
};

export default CollegeTable;
