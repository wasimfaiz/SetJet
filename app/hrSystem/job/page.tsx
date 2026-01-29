"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";
const columns = [
  { header: "Title", accessor: "title", type: "text" },
  { header: "Location", accessor: "location", type: "text" },
  { header: "Salary", accessor: "salary", type: "text" },
  { header: "Job type", accessor: "jobType", type: "text" },
];

const JobPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/jobs");
      setJobs(response.data);
      setFilteredJobs(response.data); // Initialize with all jobs
    } catch (err) {
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (filterDate) {
      const filtered = jobs.filter((job) => {
        // Ensure createdAt is a valid date before proceeding
        const isValidDate =
          job.createdAt && !isNaN(new Date(job.createdAt).getTime());
        if (!isValidDate) return false;

        const jobDate = new Date(job.createdAt).toISOString().split("T")[0];
        return jobDate === filterDate;
      });
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs); // Show all jobs if no filter is applied
    }
  }, [filterDate, jobs]);

  const handleView = (item: any) => {
    router.push(`/leadSystem/job/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/jobs?id=${selectedItem._id}`);
        setJobs((prevJobs) =>
          prevJobs.filter((job) => job._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting job:", error);
        setError("Failed to delete job.");
      } finally {
        await fetchJobs();
      }
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderActions = (item: any) => (
    <>
      {/* <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button> */}
      <button
        className="h-5 w-5 text-bloodred"
        onClick={() => openDeleteModal(item)}
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </>
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <RouteGuard requiredPermission="job">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="text-3xl text-deepblue">Jobs</div>
          <div className="flex items-center w-full justify-end pr-4">
            <Link
              href={`/leadSystem/job/add`}
              className="ml-4 bg-gradient-to-r from-blue-900 to-deepblue text-white px-6 py-4 rounded-xl hover:bg-parrotgreen"
            >
              + Add Job
            </Link>
          </div>
        </div>
        <div className="my-10 px-2">
          <Table
            data={filteredJobs}
            //@ts-ignore
            columns={columns}
            actions={renderActions}
            handleView={handleView}
          />
        </div>

        {/* Delete Modal */}
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      </div>
    </RouteGuard>
  );
};

export default JobPage;
