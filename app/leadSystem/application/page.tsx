"use client";

import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Table from "../../components/table";
import { usePersistentTab } from "../../hooks/usePersistentTab";
import Loader from "../../components/loader";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import DeleteModal from "../../components/deletemodel";

// Helper: Check if date string (YYYY-MM-DD) is today
const isToday = (dateString: string): boolean => {
  if (!dateString || dateString === "-") return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const today = new Date();
  const inputDate = new Date(year, month - 1, day); // month is 0-indexed
  return (
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate()
  );
};

// Updated columns with "New" badge
const columns = [
  { header: "Applicant Name", accessor: "studentName" },
  { header: "Title", accessor: "serviceName" },
  { header: "Form Submitted", accessor: "formSubmitted", type: "boolean" },
  { header: "Payment Status", accessor: "payment.status" },
  { header: "Uploaded On", accessor: "uploadedAt" },
  
];

type Application = {
  id?: string;
  title?: string;
  studentName?: string;
  email?: string;
  uploadedAt?: string;
  serviceName?: string;
  isOpened?: boolean;
  fullName?: string;
  [k: string]: any;
};

const ApplicationsPageContent = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [tabOptions, setTabOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { activeTab, changeTab } = usePersistentTab("applications:tab");

  useEffect(() => {
    let mounted = true;

    async function fetchApplications() {
      setLoading(true);
      try {
        const res = await axios.get("/api/application");
        if (!mounted) return;

        const payload = res.data;
        const apps: Application[] = Array.isArray(payload)
          ? payload
          : payload?.applications || payload?.data || [];

        const normalized: Application[] = apps.map((a: any, i: number) => {
          const fullName =
            a.studentName ||
            a.student_name ||
            a.userName ||
            a.name ||
            a.fullName ||
            a.applicantName ||
            a.clientName ||
            a.formData?.fullName ||
            a.formData?.name ||
            a.formData?.studentName ||
            a.formData?.student_name ||
            a.formData?.passportFullName ||
            a.formData?.nameOnPassport ||
            a.formData?.cvFullName ||
            a.formData?.cvName ||
            (a.formData?.step1?.firstName && a.formData?.step1?.lastName
              ? `${a.formData.step1.firstName} ${a.formData.step1.lastName}`
              : a.formData?.step1?.firstName) ||
            "-";

          const isOpened = a.isOpened ?? false;

          return {
            id: a.id ?? a._id ?? `app_${i}`,
            title: a.title ?? a.name ?? a.documentTitle ?? "-",
            studentName: fullName,
            fullName,
            email: a.email ?? a.userEmail ?? "-",
            uploadedAt: a.uploadedAt
              ? new Date(a.uploadedAt).toISOString().split("T")[0]
              : a.createdAt
              ? new Date(a.createdAt).toISOString().split("T")[0]
              : "-",
            serviceName: a.serviceName ?? a.service_name ?? a.service ?? "Other",
            isOpened,
            ...a,
          };
        });

        setAllApps(normalized);

        // Build tab list safely
        const services = Array.from(
          new Map(normalized.map((a) => [a.serviceName, a.serviceName])).values()
        );
        const tabs = services.map((s) => ({ value: s, label: s }));

        if (tabs.length === 0) {
          setTabOptions([{ value: "All", label: "All" }]);
          if (!activeTab) changeTab("All");
        } else {
          //@ts-ignore
          setTabOptions(tabs);
          if (!activeTab || !tabs.some((t) => t.value === activeTab)) {
            //@ts-ignore
            changeTab(tabs[0].value);
          }
        }
      } catch (err) {
        console.error("Failed to fetch applications", err);
        const fallback = [{ value: "All", label: "All" }];
        setAllApps([]);
        setTabOptions(fallback);
        if (!activeTab) changeTab("All");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchApplications();
    return () => {
      mounted = false;
    };
  }, []);

  const data =
    activeTab === "All" || !activeTab
      ? allApps
      : allApps.filter((a) => a.serviceName === activeTab);

  const handleView = async (item: Application) => {
    try {
      await axios.put(`/api/application?id=${item.id}`, { isOpened: true });
    } catch {}

    setAllApps((prev) =>
      prev.map((app) =>
        app.id === item.id
          ? { ...app, isOpened: true, studentName: app.fullName }
          : app
      )
    );

    router.push(`/leadSystem/application/${item.id}`);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      try {
        await axios.delete(`/api/application?id=${selectedItem.id}`);
        setAllApps(allApps.filter((app) => app.id !== selectedItem.id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting application:", error);
      }
    }
  };

  const openDeleteModal = (item: Application) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderActions = (item: Application) => (
    <div className="flex items-center gap-3">
    <button
      className="text-bloodred hover:text-red-700"
      onClick={() => openDeleteModal(item)}
    >
      <FontAwesomeIcon icon={faTrashCan} />
    </button>

    {isToday(item.uploadedAt ?? "") && (
      <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
        New
      </span>
    )}
  </div>

    
  );

  return (
    <div className="container px-4 mt-10">
      <div className="text-lg md:text-3xl text-deepblue mb-5">Applications</div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-5 mb-8">
        {tabOptions.map((tab) => (
          <div
            key={tab.value}
            onClick={() => changeTab(tab.value)}
            className={`cursor-pointer px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-md transition-colors duration-200 text-xs md:text-sm ${
              activeTab === tab.value
                ? "bg-gradient-to-r from-green-900 to-parrotgreen text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            <span className="font-semibold">{tab.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <Table
          data={data}
          //@ts-ignore
          columns={columns}
          actions={renderActions}
          handleView={handleView}
        />
      )}

      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};

const ApplicationsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationsPageContent />
    </Suspense>
  );
};

export default ApplicationsPage;