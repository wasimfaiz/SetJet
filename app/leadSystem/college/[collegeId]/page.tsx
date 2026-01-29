"use client";

import { useEffect, useState } from "react";
import Table from "@/app/components/table";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "@/app/components/deletemodel";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
import Pagination from "@/app/components/pagination";
import { usePersistentPage } from "@/app/hooks/usePersistentPage";

const columns = [
  { header: "Course Name", accessor: "name", type: "text" },
  { header: "Duration", accessor: "duration", type: "text" },
];

const CollegePage = () => {
  const router = useRouter();
  const { collegeId } = useParams();
  const { permissions } = usePermissions();

  const [originalCourses, setOriginalCourses] = useState<any[]>([]);
  const [pageCourses, setPageCourses] = useState<any[]>([]);
  const [college, setCollege] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // pagination state
  const { currentPage, changePage } = usePersistentPage(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // fetch once on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/college?id=${collegeId}`);
        const col = res.data.colleges?.[0];
        setCollege(col);

        // normalize duration & credit arrays:
        const courses = (col?.courses || []).map((c: any) => ({
          ...c,
          duration: Array.isArray(c.duration)
            ? c.duration.map((d: any) => d.label).join(", ")
            : c.duration,
          credit: Array.isArray(c.credit)
            ? c.credit.map((d: any) => d.label).join(", ")
            : c.credit,
          streamCount: c.subcourses?.length || 0,
        }));

        // reverse the array before setting state
        const reversed = courses.slice().reverse();
        setOriginalCourses(reversed);

      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    if (collegeId) fetchData();
  }, [collegeId]);

  // whenever originalCourses, searchQuery, currentPage, or pageLimit changes, recompute pageCourses
  useEffect(() => {
    const filtered = searchQuery
      ? originalCourses.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : originalCourses;

    const total = Math.ceil(filtered.length / pageLimit);
    setTotalPages(total);

    const start = (currentPage - 1) * pageLimit;
    setPageCourses(filtered.slice(start, start + pageLimit));
  }, [originalCourses, searchQuery, currentPage, pageLimit]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    changePage(1);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await apiClient.delete(`/api/college/${collegeId}/course?id=${collegeId}`, {
        data: { courseId: selectedItem.courseId },
      });
      setOriginalCourses((prev) =>
        prev.filter((c) => c.courseId !== selectedItem.courseId)
      );
      setShowModal(false);
    } catch {
      setError("Delete failed.");
    }
  };

  const renderActions = (item: any) => (
    <>
      {item.stream === "REQUIRED" && (
        <button
          className="underline hover:text-bloodred"
          onClick={() => router.push(`/leadSystem/college/${collegeId}/${item.courseId}`)}
        >
          {item.streamCount} Streams
        </button>
      )}
      {checkButtonVisibility(permissions, "college", "edit") && (
        <button
          className="h-5 w-5 hover:text-bloodred"
          onClick={() =>
            router.push(
              college?.country === "INDIA"
                ? `/leadSystem/college/${collegeId}/addCourse?courseId=${item.courseId}`
                : `/leadSystem/college/${collegeId}/addAbroadCourse?courseId=${item.courseId}`
            )
          }
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      )}
      {checkButtonVisibility(permissions, "college", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => {
            setSelectedItem(item);
            setShowModal(true);
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-6"
        onClick={() => router.push("/leadSystem/college")}
      >
        Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{college?.name}</h1>
        {checkButtonVisibility(permissions, "college", "add") && (
          <button
            className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded-lg"
            onClick={() =>
              router.push(
                college?.country === "INDIA"
                  ? `/leadSystem/college/${collegeId}/addCourse`
                  : `/leadSystem/college/${collegeId}/addAbroadCourse`
              )
            }
          >
            + Add Course
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by course…"
          className="border p-2 rounded-lg flex-1"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Table
        data={pageCourses}
        // @ts-ignore
        columns={columns}
        actions={renderActions}
        itemsPerPage={pageLimit}
        pagination="manual"
        db={currentPage - 1}
      />

      <div className="flex justify-center mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageLimit={pageLimit}
          onPageChange={changePage}
          onPageLimitChange={(l) => {
            setPageLimit(l);
            changePage(1);
          }}
        />
      </div>

      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CollegePage;
