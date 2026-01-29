"use client";
import { useEffect, useState } from "react";
import Table from "../../components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";
import RouteGuard from "../../components/routegaurd";
import apiClient from "../../utils/apiClient";

const columns = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Email", accessor: "email", type: "text" },
  { header: "Date/Time", accessor: "createdAt", type: "dateTime" },
  { header: "Action", accessor: "action", type: "text" },
];

const ContactPage = () => {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/api/contact");
      setContacts(response.data);
      setFilteredContacts(response.data); // Initialize with all contacts
    } catch (err) {
      setError("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (filterDate) {
      const filtered = contacts.filter((contact) => {
        // Ensure createdAt is a valid date before proceeding
        const isValidDate =
          contact.createdAt && !isNaN(new Date(contact.createdAt).getTime());
        if (!isValidDate) return false;

        const contactDate = new Date(contact.createdAt)
          .toISOString()
          .split("T")[0];
        return contactDate === filterDate;
      });
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts); // Show all contacts if no filter is applied
    }
  }, [filterDate, contacts]);

  const handleView = (item: any) => {
    router.push(`/leadSystem/contact/${item._id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await apiClient.delete(`/api/contact?id=${selectedItem._id}`);
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== selectedItem._id)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting contact:", error);
        setError("Failed to delete contact.");
      } finally {
        await fetchContacts();
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
    return <div>Loading contacts...</div>;
  }

  return (
    <RouteGuard requiredPermission="contact">
      <div className="container">
        <div className="flex items-center justify-between px-4 mt-10">
          <div className="text-3xl text-deepblue">Contacts</div>
          <div className="flex items-center w-full justify-end pr-4">
            <Link
              href={`/leadSystem/contact/add`}
              className="ml-4 bg-gradient-to-r from-blue-900 to-deepblue text-white px-6 py-4 rounded-xl hover:bg-parrotgreen"
            >
              + Add Contact
            </Link>
          </div>
        </div>

        {/* Filter by Date */}
        <div className="flex justify-start mt-5 px-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </div>

        <div className="my-10 px-2">
          <Table
            data={filteredContacts}
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

export default ContactPage;
