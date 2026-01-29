"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/app/contexts/permissionContext";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import Loader from "@/app/components/loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import apiClient from "@/app/utils/apiClient";

const BlogViewPage = () => {
  const params = useParams();
  const { id } = params;
  const { permissions } = usePermissions();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const response = await apiClient.get(`/api/blogs?id=${id}`);
        setSelectedItem(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogData();
    }
  }, [id]);

  const handleEdit = () => {
    if (!selectedItem) return;
    setLoading(true);
    router.push(`/leadSystem/blog/add?id=${selectedItem._id}`);
    setLoading(false);
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between">
        <button
          className="text-blue-500 underline hover:text-deepblue cursor-pointer mb-4"
          onClick={() => router.back()}
        >
          Back
        </button>
        {checkButtonVisibility(permissions, "blog", "edit") && (
          <button
            onClick={handleEdit}
            className="text-deepblue px-4 py-2 rounded hover:bg-blue-800 mt-4 underline"
          >
            Edit <FontAwesomeIcon icon={faEdit}/>
          </button>
        )}
      </div>
      {selectedItem && (
        <div className="bg-white rounded-md shadow-md p-4 space-y-4">
          <div>
            <h1 className="text-xl font-bold">{selectedItem.title}</h1>
            <p className="text-sm text-gray-600">
              {selectedItem.author} • {selectedItem.date}
            </p>
          </div>

          {selectedItem.picture && (
            <img
              src={selectedItem.picture}
              alt="Blog Banner"
              className="w-full max-w-2xl rounded-md shadow-md"
            />
          )}

          <div>
            <p className="text-sm text-gray-700 font-semibold">Meta Description:</p>
            <p className="text-sm">{selectedItem.metaDesc}</p>
          </div>

          <div>
            <p className="text-sm text-gray-700 font-semibold">Category:</p>
            <p className="text-sm">{selectedItem.category}</p>
          </div>

          <div>
            <p className="text-sm text-gray-700 font-semibold">Description:</p>
            <p className="text-sm">{selectedItem.desc}</p>
          </div>

          <div>
            <p className="text-sm text-gray-700 font-semibold">Content:</p>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedItem.content }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogViewPage;
