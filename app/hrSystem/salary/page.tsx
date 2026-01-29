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
import Loader from "../../components/loader";  // Import the Loader component
import apiClient from "../../utils/apiClient";

const columns = [
    { header: "Employee", accessor: "employeeName", type: "text" },
    { header: "Salary Date", accessor: "salaryDate", type: "date" },
    { header: "Designation", accessor: "designation", type: "text" },
    { header: "Location", accessor: "location", type: "text" },
];

const SalaryPage = () => {
    const router = useRouter();
    const [salary, setSalary] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false); // New state to track typing

    const fetchSalary = async (search: string = "", date: string = "") => {
        setError(null);
        if (!isTyping) {  // Only show loader if not typing
            setLoading(true);
        }
        try {
            let url = "/api/salary?";
            const params = new URLSearchParams();
            if (search) {
                params.append("search", search);
            }
            if (date) {
                params.append("date", date);
            }

            if (params.toString()) {
                url += params.toString();
            }

            const response = await apiClient.get(url);
            setSalary(response.data);
        } catch (err) {
            console.error("Fetch Salary Error:", err);
            setError("Failed to load salary.");
        } finally {
            if (!isTyping) { // Only hide loader if not typing
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const initialLoad = async () => {
            setLoading(true);
            await fetchSalary();
            setLoading(false);
        };

        initialLoad();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setIsTyping(false);  // Set typing to false after delay
            fetchSalary(searchTerm, selectedDate);
        }, 300);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchTerm, selectedDate]);


    const handleView = (item: any) => {
        router.push(`/hrSystem/salary/${item._id}`);
    };

    const handleDelete = async () => {
        if (selectedItem) {
            try {
                await apiClient.delete(`/api/salary?id=${selectedItem._id}`);
                setSalary((prevSalary) =>
                    prevSalary.filter((salary) => salary._id !== selectedItem._id)
                );
                setShowModal(false);
            } catch (error) {
                console.error("Error deleting salary:", error);
                setError("Failed to delete salary.");
            } finally {
                await fetchSalary(searchTerm, selectedDate);
            }
        }
    };

    const handlePdf = async (item: any) => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
        const createdAt = new Date(now.getTime() + istOffset);
        const payload = {
            ...item,
            download: true,
            pdfDownloadedAt: createdAt,
        };
        try {
            const response = await apiClient.put(
                `/api/database/student-database?id=${item._id}`,
                payload
            );
            if (response.status === 200) {
                fetchSalary(searchTerm, selectedDate);// Fetch data for previous page
                handleDownload(item);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDownload = async (item: any) => {
        try {
            const response = await apiClient.post("/api/salary/generate-pdf", { id: item._id }, {
                responseType: "blob", // Expect binary data
            });

            if (response.status === 200) {
                // Create a download link for the PDF
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Invoice_${item.invoiceNumber}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };


    const handleSearch = (searchString: string) => {
        setIsTyping(true); // Set typing to true on input change
        setSearchTerm(searchString);
    };

    const handleDateChange = (dateString: string) => {
        setIsTyping(true); // Set typing to true on date change
        setSelectedDate(dateString);
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
    <RouteGuard requiredPermission="salary">
        <div className="container">
            <div className="flex items-center justify-between px-4 mt-10">
                <div className="text-3xl text-deepblue">Salary</div>
                <div className="flex items-center w-full justify-end pr-4">
                    <Link
                        href={`/hrSystem/salary/add`}
                        className="ml-2 md:ml-4 bg-gradient-to-r from-blue-900 to-deepblue hover:bg-gradient-to-r hover:from-green-900 hover:to-parrotgreen text-white px-2 py-1 md:px-6 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base transition duration-200"
                    >
                        + Add Salary
                    </Link>
                </div>
            </div>
            <div className="my-4 flex gap-1">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name email employeeid"
                    className="border p-2 w-full lg:w-1/4 rounded-lg"
                />

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="border p-1 w-full lg:w-1/6 rounded-lg"
                />
            </div>
            <div className="my-10 px-2">
                <Table
                    data={salary}
                    //@ts-ignore
                    columns={columns}
                    actions={renderActions}
                    handleView={handleView}
                    handlePdf={handlePdf}
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

export default SalaryPage;
