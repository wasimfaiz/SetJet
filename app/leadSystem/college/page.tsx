// app/college/page.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { usePermissions } from "../../contexts/permissionContext";
import RouteGuard from "../../components/routegaurd";
import DeleteModal from "../../components/deletemodel";
import CollegeModal from "../../components/createCollegeModal";
import Loader from "../../components/loader";
import Pagination from "../../components/pagination";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import { usePersistentPage } from "../../hooks/usePersistentPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faEdit, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import usePersistentState from "../../hooks/usePersistentState";
import CollegeCard from "../../components/collegeCard";
import apiClient from "../../utils/apiClient";

const options = [
  { value: "ALL", label: "ALL" },
  { value: "ABROAD", label: "ABROAD" },
  { value: "INDIA", label: "INDIA" },
];
const countries = [
  "AUSTRALIA",
  "AUSTRIA",
  "BANGLADESH",
  "BHUTAN",
  "CANADA",
  "CHINA",
  "FINLAND",
  "GEORGIA",
  "GERMANY",
  "INDIA",
  "ITALY",
  "LUXEMBOURG",
  "MALTA",
  "NEPAL",
  "NEW ZEALAND",
  "RUSSIA",
  "SINGAPORE",
  "SWEDEN",
  "SWITZERLAND",
  "UK",
  "USA",
  "MAURITIUS"
];
const CollegePageContent = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { activeTab } = usePersistentTab("ALL");
  const inputRef = useRef<HTMLInputElement>(null);

  // Persisted filters
  const [selectedState,   setSelectedState]   = usePersistentState("college-filter-state",  "");
  const [selectedCity,    setSelectedCity]    = usePersistentState("college-filter-city",   "");
  const [selectedCourse,  setSelectedCourse]  = usePersistentState("college-filter-course", "");
  const [selectedStream,  setSelectedStream]  = usePersistentState("college-filter-stream", "");
  const [searchQuery,     setSearchQuery]     = usePersistentState("college-filter-search", "");

  // Country tab (not persisted, but initialized from activeTab)
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);

  // Dependent filter options
  const [states,         setStates]         = useState<{ label: string; value: string }[]>([]);
  const [cities,         setCities]         = useState<string[]>([]);
  const [courseOptions,  setCourseOptions]  = useState<string[]>([]);
  const [streamOptions,  setStreamOptions]  = useState<string[]>([]);

  // Data + UI state
  const [college,           setCollege]           = useState<any[]>([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [selectedItem,      setSelectedItem]      = useState<any>(null);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [showCollegeModal,  setShowCollegeModal]  = useState(false);

  // Pagination
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit]   = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 1) Reusable fetch function
  const fetchColleges = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        country: String(selectedCountry),
        page:    String(currentPage),
        limit:   String(pageLimit),
      });
      if (selectedState)  params.append("state",      selectedState);
      if (selectedCity)   params.append("city",       selectedCity);
      if (searchQuery)    params.append("search",     searchQuery);
      if (selectedCourse) params.append("courseName", selectedCourse);
      if (selectedStream) params.append("streamName", selectedStream);

      const { data } = await apiClient.get(`/api/college?${params}`);
      const enriched = data.colleges.map((c: any) => ({
        ...c,
        courseCount: c.courses?.length || 0,
      }));
      setCollege(enriched);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load colleges.");
    } finally {
      setLoading(false);
    }
  };

  // Load filter options on mount
  useEffect(() => {
    apiClient.get("/api/states")
      .then(r => setStates(r.data))
      .catch(console.error);

    apiClient.get("/api/college/courses")
      .then(r => setCourseOptions(r.data))
      .catch(console.error);
  }, []);

  // Dependent load: cities when state changes
  useEffect(() => {
    if (!selectedState) return;
    apiClient.get(`/api/cities?state=${encodeURIComponent(selectedState)}`)
      .then(r => setCities(r.data.cities || []))
      .catch(console.error);
  }, [selectedState]);

  // Dependent load: streams when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setStreamOptions([]);
      setSelectedStream("");
      return;
    }
    apiClient.get(
      `/api/college?courseName=${encodeURIComponent(selectedCourse)}&limit=1000`
    )
    .then(({ data }) => {
      const s = new Set<string>();
      data.colleges.forEach((c: any) =>
        c.courses?.forEach((course: any) => {
          if (course.name === selectedCourse) {
            course.subcourses?.forEach((sc: any) => s.add(sc.name));
          }
        })
      );
      setStreamOptions(Array.from(s));
      setSelectedStream("");
    })
    .catch(console.error);
  }, [selectedCourse]);

  // Fetch on filters or pagination change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchColleges, 300);
    return () => clearTimeout(timer);
  }, [
    selectedCountry,
    selectedState,
    selectedCity,
    searchQuery,
    selectedCourse,
    selectedStream,
    currentPage,
    pageLimit,
  ]);

  // 2) handleAddCollege calls fetchColleges
  const handleAddCollege = async (data: any) => {
    try {
      if (data._id) {
        const id = data._id;
        delete data._id;
        await apiClient.put(`/api/college?id=${id}`, data);
      } else {
        await apiClient.post("/api/college", data);
      }
      await fetchColleges();
      setShowCollegeModal(false);
    } catch (err) {
      console.error("Error adding college:", err);
      setError("Failed to add college.");
    }
  };

  const handleDeleteOpen = (it: any) => {
    setSelectedItem(it);
    setShowDeleteModal(true);
  };
  const handleDelete = async () => {
    if (!selectedItem) return;
    await apiClient.delete(`/api/college?id=${selectedItem._id}`);
    setShowDeleteModal(false);
    setCollege(c => c.filter(x => x._id !== selectedItem._id));
  };

  // Fix: country tab updates selectedCountry and refetch
  const handleNavigation = (tab: string) => {
    changePage(1);
    router.push(
      tab === "ALL"
        ? "/leadSystem/college"
        : `/leadSystem/college/${tab.toLowerCase()}`
    );
  };

  const handleOverView = (id: any) => router.push(`/leadSystem/college/${id}/view`);
  const handleView     = (it: any) => router.push(`/leadSystem/college/${it._id}`);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart } = e.target;
    setSearchQuery(value);
    changePage(1);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (typeof selectionStart === "number") {
          inputRef.current.setSelectionRange(selectionStart, selectionStart);
        }
      }
    });
  };

  if (loading && !searchQuery) return <Loader />;

  return (
    <RouteGuard requiredPermission="college">
      <div className="relative mt-16 mb-8 w-[80%] mx-auto px-4">
        <div className="flex justify-between items-center my-6">
          <h1 className="text-3xl font-bold text-deepblue">Colleges</h1>
          {checkButtonVisibility(permissions, "college", "add") && (
            <button
              onClick={() => setShowCollegeModal(true)}
              className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded-lg"
            >
              + Add College
            </button>
          )}
        </div>

        {/* Country Tabs */}
        <div className="flex space-x-2 mt-5 md:gap-3 items-center mx-2 w-full md:w-1/2 my-2">
          {options.map(loc => (
            <div
              key={loc.value}
              onClick={() => handleNavigation(loc.value)}
              className={`cursor-pointer px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 md:w-1/3 ${
                loc.value === "ALL"
                  ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-5">
                <FontAwesomeIcon icon={faBuilding} className="text-green-800 bg-white rounded-full p-2" />
                <span className="text-xs font-semibold">{loc.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name / course / stream"
          className="sticky top-0 bg-white border p-2 rounded-lg flex-1"
          value={searchQuery}
          onChange={handleSearchChange}
        />
          <select
            className="border p-2 rounded-lg"
            value={selectedCountry}
            onChange={e => {
              //@ts-ignore
              setSelectedCountry(e.target.value);
              changePage(1);
            }}
          >
            <option value="">All Countries</option>
            {countries.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="border p-2 rounded-lg"
            value={selectedState}
            onChange={e => {
              setSelectedState(e.target.value);
              setSelectedCity("");
              changePage(1);
            }}
          >
            <option value="">All States</option>
            {states.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {selectedState && (
            <select
              className="border p-2 rounded-lg"
              value={selectedCity}
              onChange={e => {
                setSelectedCity(e.target.value);
                changePage(1);
              }}
            >
              <option value="">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <select
            className="border p-2 rounded-lg"
            value={selectedCourse}
            onChange={e => {
              setSelectedCourse(e.target.value);
              changePage(1);
            }}
          >
            <option value="">All Courses</option>
            {courseOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {selectedCourse && (
            <select
              className="border p-2 rounded-lg"
              value={selectedStream}
              onChange={e => {
                setSelectedStream(e.target.value);
                changePage(1);
              }}
            >
              <option value="">All Streams</option>
              {streamOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {college.map(col => (
            <CollegeCard
              key={col._id}
              col={col}
              permissions={permissions}
              onView={handleView}
              onEdit={c => { setSelectedItem(c); setShowCollegeModal(true); }}
              onDelete={handleDeleteOpen}
              onOverview={handleOverView}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center my-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
            onPageLimitChange={limit => {
              setPageLimit(limit);
              changePage(1);
            }}
            pageLimit={pageLimit}
          />
        </div>

        {/* Modals */}
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
        <CollegeModal
          show={showCollegeModal}
          onClose={() => {
            setShowCollegeModal(false);
            setSelectedItem(null);
          }}
          onSave={handleAddCollege}
          college={selectedItem}
        />
      </div>
    </RouteGuard>
  );
};

export default function CollegePage() {
  return (
    <Suspense fallback={<Loader />}>
      <CollegePageContent />
    </Suspense>
  );
}
