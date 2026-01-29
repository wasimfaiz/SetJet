// components/Sidebar.tsx
"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBank,
  faBlog,
  faPeopleGroup,
  faFaceLaughBeam,
  faMoneyBill,
  faPhone,
  faSignOut,
  faSuitcase,
  faTv,
  faStore,
  faDatabase,
  faUser,
  faBook,
  faFile,
  faTable,
  faBuilding,
  faExchangeAlt,
  faFileInvoice,
  faFileAlt,
  faPlantWilt,
  faListCheck,
  faTableList,
  faUserFriends,
  faBell,
  faChevronDown,
  faChevronRight,
  faCalendarCheck,
  faSync,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { faConnectdevelop } from "@fortawesome/free-brands-svg-icons";

import NotificationPopup from "./NotificationPopup";
import { usePermissions } from "../contexts/permissionContext";
import { useEmployeeContext } from "../contexts/employeeContext";
import { usePersistentPage } from "../hooks/usePersistentPage";
import socket from "../lib/socket";
import apiClient from "../utils/apiClient";
import InfoCard from "./infoCard";

const SidebarContent: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { changePage } = usePersistentPage(1);
  const { permissions, role, loading, error, fetchPermissions } =
    usePermissions();
  const { employeeName, employeeEmail, employeeId, logout } =
    useEmployeeContext();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [leadOpen, setLeadOpen] = useState(true);
  const [coachOpen, setCoachOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 1. Permissions refetch
  useEffect(() => {
    if (!loading && !role && !hasRedirected) {
      fetchPermissions();
      setHasRedirected(true);
    }
  }, [loading, role, fetchPermissions, hasRedirected]);

  // 2. Session expiry
  useEffect(() => {
    if (error) {
      alert("Session expired or invalid. Redirecting to login.");
      router.push("/");
    }
  }, [error, router]);

  // 3. Socket: join & task updates
  useEffect(() => {
    if (!employeeId) return;
    socket.on("connect", () => {
      socket.emit("join", employeeId);
    });
    const onTask = (payload: any) => {
      setNotifications((prev) => [payload, ...prev]);
      setShowNotifications(true);
    };
    socket.on("task-updated", onTask);
    return () => {
      socket.off("task-updated", onTask);
    };
  }, [employeeId]);

  // 5. Fetch initial tasks
  useEffect(() => {
    if (!employeeId) return;
    apiClient
      .get(`/api/tasks?employeeId=${employeeId}`)
      .then((res) => setTasks(res.data.tasks))
      .catch(() => {});
  }, [employeeId]);

  const handleNav = (path: string) => {
    changePage(1);
    router.push(path);
  };

  // 6. Expand/collapse
  useEffect(() => {
    setLeadOpen(pathname.startsWith("/leadSystem/"));
    setCoachOpen(pathname.startsWith("/coachingSystem/"));
    setHrOpen(pathname.startsWith("/hrSystem/"));
  }, [pathname]);

  // 7. Define nav sections
  const navSections = [
    {
      title: null,
      prefix: "",
      items: [
        {
          icon: faUser,
          label: "Profile",
          link: "/profile",
          permission: "profile",
          showFor: "ALL",
        },
      ],
    },
    {
      title: "Lead Management System",
      prefix: "/leadSystem",
      items: [
        {
          icon: faTv,
          label: "Dashboard",
          link: "/dashboard",
          permission: "dashboard",
          showFor: "ALL",
        },
        {
          icon: faTableList,
          label: "Tasks Management",
          link: "/taskmanage",
          permission: "taskmanage",
          showFor: "ALL",
        },
        {
          icon: faBook,
          label: "Ground Leads Management",
          link: "/leadmanage",
          permission: "leadmanage",
          showFor: "ALL",
        },
        {
          icon: faDatabase,
          label: "Database",
          link: "/database",
          permission: "database",
          showFor: "ALL",
        },
        {
          icon: faDatabase,
          label: "My Database",
          link: "/mydatabaseleads",
          permission: "mydatabaseleads",
          showFor: "ALL",
        },
        {
          icon: faPlantWilt,
          label: "Ground Leads",
          link: "/leads",
          permission: "lead",
          showFor: "ALL",
        },
        {
          icon: faExchangeAlt,
          label: "Transferred Leads",
          link: "/transfer",
          permission: "transfer",
          showFor: "EMPLOYEE",
        },
        {
          icon: faListCheck,
          label: "My Tasks",
          link: "/mytask",
          permission: "mytask",
          showFor: "EMPLOYEE",
        },
        {
          icon: faStore,
          label: "Clients",
          link: "/client",
          permission: "client",
          showFor: "ALL",
        },
        {
          icon: faUserFriends,
          label: "Users & Admission Enquiries",
          link: "/userAdmission",
          permission: "userAdmission",
          showFor: "ALL",
        },
        {
          icon: faBuilding,
          label: "Colleges",
          link: "/college",
          permission: "college",
          showFor: "ALL",
        },
        {
  icon: faCalendarCheck,  // Good icon for time slots / booking
  label: "Slots",
  link: "/slots",
  permission: "slots",           // This should match your backend permission key
  showFor: "ALL",
},
        {
          icon: faPhone,
          label: "Enquiry",
          link: "/enquiry",
          permission: "enquiry",
          showFor: "ALL",
        },
        {
          icon: faFileInvoice,
          label: "Invoice",
          link: "/invoice",
          permission: "invoice",
          showFor: "ALL",
        },
        {
          icon: faFile,
          label: "Document Format",
          link: "/format",
          permission: "format",
          showFor: "ALL",
        },
        {
          icon: faFaceLaughBeam,
          label: "Offers",
          link: "/offer",
          permission: "offer",
          showFor: "ALL",
        },
        {
          icon: faPen,
          label: "Applications",
          link: "/application",
          permission: "application",
          showFor: "ALL",
        },
        {
          icon: faBlog,
          label: "Blogs",
          link: "/blog",
          permission: "blog",
          showFor: "ALL",
        },
        {
          icon: faConnectdevelop,
          label: "B2B",
          link: "/b2b",
          permission: "b2b",
          showFor: "ALL",
        },
      ],
    },
    {
      title: "Coaching Management System",
      prefix: "/coachingSystem",
      items: [
        {
          icon: faUser,
          label: "Students",
          link: "/student",
          permission: "student",
          showFor: "ALL",
        },
        {
          icon: faBook,
          label: "Batch",
          link: "/batch",
          permission: "batch",
          showFor: "ALL",
        },
        {
          icon: faTv,
          label: "Faculty",
          link: "/faculty",
          permission: "faculty",
          showFor: "ALL",
        },
        {
          icon: faTableList,
          label: "Attendance",
          link: "/attendance",
          permission: "attendance",
          showFor: "ALL",
        },
        {
          icon: faMoneyBill,
          label: "Fees",
          link: "/fee",
          permission: "fee",
          showFor: "ALL",
        },
      ],
    },
    {
      title: "HR Management System",
      prefix: "/hrSystem",
      items: [
        {
          icon: faPeopleGroup,
          label: "Employees",
          link: "/employee",
          permission: "employee",
          showFor: "ALL",
        },
        {
          icon: faSuitcase,
          label: "Jobs",
          link: "/job",
          permission: "job",
          showFor: "ALL",
        },
        {
          icon: faCalendarCheck,
          label: "Leave",
          link: "/leave",
          permission: "leave",
          showFor: "ALL",
        },

        {
          icon: faFileAlt,
          label: "Salary",
          link: "/salary",
          permission: "salary",
          showFor: "ALL",
        },
      ],
    },
  ];

  const filterNav = (nav: any) => {
    if (nav.permission === "profile") return true;
    if (["mydatabase", "transfer", "mytask"].includes(nav.permission))
      return role === "EMPLOYEE";
    if (nav.showFor && nav.showFor !== "ALL" && nav.showFor !== role)
      return false;
    return (
      permissions === "all" || permissions[nav.permission]?.includes("view")
    );
  };

  return (
    <>
      <InfoCard name={employeeName || ""} email={employeeEmail || ""} />
      <div className="sidebar h-full fixed md:relative top-0 left-0 flex flex-col bg-white shadow md:w-1/5 w-12 transition-all space-y-1 md:space-y-2">
        <div className="flex items-center justify-center md:justify-start p-2 md:p-4">
          <img
            src="/europass.logo.png"
            alt="Logo"
            className="hidden md:block h-12"
          />
          <img src="/logo.png" alt="Logo" className="block md:hidden h-6" />
        </div>

        {navSections.map((sec, si) => (
          <React.Fragment key={si}>
            {sec.title ? (
              <button
                onClick={() =>
                  sec.title === "Lead Management System"
                    ? setLeadOpen(!leadOpen)
                    : sec.title === "Coaching Management System"
                    ? setCoachOpen(!coachOpen)
                    : setHrOpen(!hrOpen)
                }
                className={`flex items-center w-full py-5 h-12 md:h-16 px-2 md:px-6 mt-1 justify-between
                  ${
                    (sec.title === "Lead Management System" && leadOpen) ||
                    (sec.title === "Coaching Management System" && coachOpen) ||
                    (sec.title === "HR Management System" && hrOpen)
                      ? "bg-gradient-to-r from-blue-900 to-deepblue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="hidden md:inline ml-4 text-sm">
                  {sec.title}
                </span>
                <FontAwesomeIcon
                  icon={
                    (sec.title === "Lead Management System" && leadOpen) ||
                    (sec.title === "Coaching Management System" && coachOpen) ||
                    (sec.title === "HR Management System" && hrOpen)
                      ? faChevronDown
                      : faChevronRight
                  }
                  className="w-4 h-4"
                />
              </button>
            ) : null}

            {(sec.title
              ? sec.title === "Lead Management System"
                ? leadOpen
                : sec.title === "Coaching Management System"
                ? coachOpen
                : hrOpen
              : true) &&
              sec.items.filter(filterNav).map((nav) => {
                const fullLink = sec.prefix + nav.link;
                const isActive = pathname.includes(fullLink);
                return (
                  <button
                    key={nav.label}
                    onClick={() => handleNav(fullLink)}
                    className={`flex items-center w-full py-5 h-10 md:h-14 pl-3 md:pl-16 pr-2 md:pr-6 rounded-lg
                    ${
                      isActive
                        ? "bg-blue-200 text-deepblue"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={nav.icon}
                      className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="hidden md:inline ml-3 text-base text-sm">
                      {nav.label}
                    </span>
                  </button>
                );
              })}
          </React.Fragment>
        ))}

        <div className="flex-grow" />
        <Link href="/" onClick={logout} className="w-full">
          <button className="flex items-center w-full h-12 md:h-16 px-2 md:px-6 bg-gray-800 text-gray-200 hover:bg-gradient-to-r hover:from-blue-900 hover:to-deepblue">
            <FontAwesomeIcon
              icon={faSignOut}
              className="w-6 h-6 md:w-7 md:h-7"
            />
            <span className="hidden md:inline ml-4 text-lg">Logout</span>
          </button>
        </Link>
      </div>
      {/* Popups */}
      <NotificationPopup
        pollData={notifications}
        isVisible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          setNotifications([]);
        }}
      />
      <audio ref={audioRef} src="/notify.mp3" preload="auto" />
    </>
  );
};

const Sidebar: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SidebarContent />
  </Suspense>
);

export default Sidebar;
