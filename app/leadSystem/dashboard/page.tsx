"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import RouteGuard from "../../components/routegaurd";
import PaidAmountChart from "@/app/components/paidAmountChart";


const Dashboard = () => {
  const router = useRouter();

  // STATE IS NOW EXPLICITLY TYPED (VERY IMPORTANT)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/invoice?pagination=manual`);
      setInvoices(response.data?.invoices);
    } catch (err) {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
    };
    fetchInvoices()
  }, []);

  return (
    <RouteGuard requiredPermission="dashboard">
      <div className="container max-w-8xl mx-auto my-10">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Revenue</h1>
          <PaidAmountChart invoices={invoices} />
        </div>
      </div>
    </RouteGuard>
  );
};

export default Dashboard;