"use client";
import React, { useEffect, useState } from "react";
import Table from "@/app/components/table";
import DeleteModal from "@/app/components/deletemodel";
import RouteGuard from "@/app/components/routegaurd";
import Loader from "@/app/components/loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import apiClient from "@/app/utils/apiClient";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import { usePermissions } from "@/app/contexts/permissionContext";
const columns = [
  { header: "Student", accessor: "student.name" },
  { header: "Batch",   accessor: "batch.name"   },
  { header: "Month",  accessor: "monthPaid.month"       },
  { header: "Date",    accessor: "paymentDate"         },
];

export default function FeesPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [delShow, setDelShow] = useState(false);
  const [sel, setSel]         = useState<any>(null);
  const{permissions} = usePermissions();

  const fetchAll = async () => {
    setLoading(true);
    const res = await apiClient.get("/api/fees");
    setRows(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleView   = (r:any) => router.push(`/coachingSystem/fee/${r._id}`);
  const onDelete = async () => {
    await apiClient.delete(`/api/fees?id=${sel._id}`);
    setDelShow(false);
    fetchAll();
  };

  const renderActions = (r:any) => (
    <div className="flex gap-2">
      {checkButtonVisibility(permissions,"fee","delete") && (
      <button onClick={()=>{ setSel(r); setDelShow(true); }} className="text-red-600">
        <FontAwesomeIcon icon={faTrashCan}/>
      </button>
      )}
    </div>
  );


  if (loading) return <Loader />;
  return (
    <RouteGuard requiredPermission="fee">
      <div className="container mx-auto p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Fees</h1>
          {checkButtonVisibility(permissions,"fee","add") && (
          <Link
            href="/coachingSystem/fee/add"
            className="bg-gradient-to-r from-blue-900 to-deepblue text-white px-4 py-2 rounded"
          >+ Add Fee</Link>
          )}
        </div>
        <Table data={rows} columns={columns} actions={renderActions} handleView={handleView}/>
        <DeleteModal
          show={delShow}
          onClose={()=>setDelShow(false)}
          onDelete={onDelete}
        />
      </div>
    </RouteGuard>
  );
}
