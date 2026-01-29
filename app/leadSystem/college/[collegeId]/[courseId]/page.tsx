"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Table from "@/app/components/table";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "@/app/components/deletemodel";
import Link from "next/link";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const columns = [
  { header: "Stream Name", accessor: "name", type: "text" },
  {
    header: "Duration",
    accessor: "duration",
    type: "text",
  },
  {
    header: "Total Fee (Per Year)",
    accessor: "totalFeePerYear",
    type: "text",
  },
  {
    header: "Total Course Fee",
    accessor: "totalFeeFullCourse",
    type: "text",
  },

];

const CollegePage = () => {
  const router = useRouter();
  const params = useParams();
  const { permissions } = usePermissions();

  const { collegeId, courseId } = params;
  const [stream, setStream] = useState();
  const [originalStreams, setOriginalStreams] = useState(); // Unfiltered streams
  const [course, setCourse] = useState();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState();
  const [showModal, setShowModal] = useState<boolean>(false);

  // Fetch college details
  const fetchCollege = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/college?id=${collegeId}`);

      // Find the main course matching the courseId
      const mainCourse = response?.data?.colleges?.[0]?.courses?.find(
        (course: any) => course.courseId === courseId
      );

      // Set the sub-courses inside the main course
      const streams = mainCourse?.subcourses || [];
      setStream(streams);
      setOriginalStreams(streams); // Save original list of streams
      setCourse(mainCourse?.name);
    } catch (err) {
      setError("Failed to load college data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) {
      fetchCollege();
    }
  }, [collegeId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query === "") {
      setStream(originalStreams); // Reset to the original list when query is empty
    } else {
      //@ts-ignore
      const filteredStreams = originalStreams.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setStream(filteredStreams);
    }
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/college/${collegeId}/course/${courseId}/courses`, {
          headers: { "Content-Type": "application/json" },
          //@ts-ignore
          data: { subCourseId: selectedItem?.subCourseId },
        });
        //@ts-ignore
        setStream((prevStreams: any[]) =>
          //@ts-ignore
          prevStreams?.filter((c) => c.subCourseId !== selectedItem?.subCourseId)
        );
        //@ts-ignore
        setOriginalStreams((prevStreams: any[]) =>
          //@ts-ignore
          prevStreams?.filter((c) => c.subCourseId !== selectedItem?.subCourseId)
        ); // Update originalStreams as well

        setShowModal(false);
      } catch (error) {
        console.error("Failed to delete course:", error);
        setError("Failed to delete course. Please try again later.");
      }
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    router.push(`/leadSystem/college/${collegeId}/${courseId}/${item.subCourseId}`);
  };

  const handleAddCourse = () => {
    router.push(`/leadSystem/college/${collegeId}/${courseId}/addCourse`);
  };
  const handleEdit = (item: any) => {
    router.push(`/leadSystem/college/${collegeId}/${courseId}/addCourse?subCourseId=${item.subCourseId}`);
  };

  const renderActions = (item: any) => (
    <>
      <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button>
      {checkButtonVisibility(permissions, "college", "edit") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => handleEdit(item)}
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      )}
      {checkButtonVisibility(permissions, "college", "delete") && (
        <button
          className="h-5 w-5 text-bloodred"
          onClick={() => openDeleteModal(item)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
    </>
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-4">
      <Link
        className="text-blue-500 underline hover:text-deepblue cursor-pointer"
        href={`/leadSystem/college/${collegeId}`}
      >
        Back
      </Link>

      <div className="flex items-center justify-between mt-6">
        <h1 className="lg:text-lg font-bold text-deepblue">
          Streams for {course}
        </h1>
        {checkButtonVisibility(permissions, "college", "add") && (
          <button
          className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white px-4 py-2 rounded-lg"
          onClick={handleAddCourse}
        >
          + Add Streams
        </button>)}
      </div>

      <div className="my-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by stream"
          className="border p-2 w-full lg:w-1/3 rounded-lg"
        />
      </div>

      <div className="my-6">
        {error && <div className="text-red-500">{error}</div>}
        <Table
          //@ts-ignore
          data={stream}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CollegePage;
