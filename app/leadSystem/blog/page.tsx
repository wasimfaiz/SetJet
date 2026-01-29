"use client";
import { useEffect, useState } from "react";
import axios from "axios"; // Import Axios
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import { checkButtonVisibility } from "../../utils/helperFunc";
import { usePermissions } from "../../contexts/permissionContext";
import Loader from "../../components/loader";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Title", accessor: "title" },
  { header: "Author", accessor: "author" },
  { header: "Date", accessor: "date" },
  { header: "Category", accessor: "category" },
];

const BlogPage = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const [data, setData] = useState<any[]>([]); // State to hold blog data
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [selectedItem, setSelectedItem] = useState<any>(null); // Selected visit for deletion
  const [showModal, setShowModal] = useState<boolean>(false); // Modal visibility

  // Fetch the blogs data from the API
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/blogs"); // Replace with your actual API endpoint
      setData(response.data); // Assuming the response contains an array of blog data
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setError("Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleView = (item: any) => {
    router.push(`/leadSystem/blog/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/blogs?id=${selectedItem._id}`); // Make DELETE request with ID
        setData(data.filter((item) => item._id !== selectedItem._id)); // Remove from state
        setShowModal(false); // Close modal
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item); // Set the selected visit for deletion
    setShowModal(true); // Show modal
  };

  const renderActions = (item: any) => (
    <>
      {/* <button className="h-5 w-5" onClick={() => handleView(item)}>
        <FontAwesomeIcon icon={faEye} />
      </button> */}
      {checkButtonVisibility(permissions, "blog", "delete") && (
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
    return <Loader />; // Show loading while data is being fetched
  }

  return (
    <RouteGuard requiredPermission="blog">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="md:text-3xl text-lg text-deepblue">Blogs</div>
          <div className="flex items-center w-full justify-end pr-2 md:pr-4">
            {checkButtonVisibility(permissions, "blog", "add") && (
              <Link
                href={`/leadSystem/blog/add`}
                className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
              >
                + Add Blog
              </Link>
            )}
          </div>
        </div>
        <div className="my-10 px-2">
          <Table
            data={data}
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

export default BlogPage;
