"use client";
import React, { useEffect, useState, useMemo } from "react";
import apiClient from "@/app/utils/apiClient";
import Table from "@/app/components/table";
import Loader from "@/app/components/loader";
import { useRouter } from "next/navigation";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RouteGuard from "@/app/components/routegaurd";

interface Employee {
  _id: string;
  basicField: { name: string; empId: string; email: string }; 
}
interface LeaveRecord {
  _id: string;
  employee: { id: string; name: string };
  month: { year: string; month: string };
  leaves: { date: string; type: string }[];
}

const LeaveTablePage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    { header: "Employee ID", accessor: "empId" },
    { header: "Employee Name", accessor: "name" },
    { header: "Leaves Taken", accessor: "taken" },
    { header: "Leaves Remaining", accessor: "remaining" },
  ];

  const fetchData = async () => {
    try {
      const currentYear = new Date().getFullYear().toString();
      const [empRes, leaveRes] = await Promise.all([
        apiClient.get<Employee[]>("/api/employees?status=ACTIVE"),
        apiClient.get<LeaveRecord[]>(`/api/leaves?year=${currentYear}`),
      ]);
      setEmployees(empRes.data);
      setLeaves(
        leaveRes.data.filter((l) => l.month.year === currentYear)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const filteredEmps = employees.filter((emp) =>
      emp.basicField.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.basicField.empId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.basicField.email.toLowerCase().includes(searchTerm.toLowerCase()) 
    );
    return filteredEmps.map((emp) => {
      const recs = leaves.filter((l) => l.employee.id === emp._id);
      let taken = 0;
      recs.forEach((r) => {
        r.leaves.forEach((lv) => {
          if (lv.type === "Full Day") taken += 1;
          else if (lv.type === "Half Day") taken += 0.5;
        });
      });
      const allowed = 18;
      const remaining = Math.max(0, allowed - taken);
      return {
        id: emp._id,
        name: emp.basicField.name,
        empId: emp.basicField.empId,
        taken,
        remaining,
      };
    });
  }, [employees, leaves, searchTerm]);

  const handleView = (item: any) => {
    router.push(`/hrSystem/leave/${item.id}`);
  };

  if (loading) return <Loader />;

  return (
  <RouteGuard requiredPermission="leave">
    <div className="container mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Leave Summary ({new Date().getFullYear()})</h1>
        <button
          className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded"
          onClick={() => router.push("/hrSystem/leave/add")}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Leave
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by employee name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <Table
        data={stats}
        //@ts-ignore
        columns={columns}
        //@ts-ignore
        actions={()=>{}}
        handleView={handleView}
        pagination="manual"
        itemsPerPage={100}
      />
    </div>
  </RouteGuard>
  );
};

export default LeaveTablePage;