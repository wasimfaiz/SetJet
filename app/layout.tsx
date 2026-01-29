"use client";
import React from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "./components/sidebar";
import { PermissionsProvider } from "./contexts/permissionContext";
import { EmployeeProvider } from "./contexts/employeeContext";
import SocketManager from "./components/socketManager";
import { useTokenCheck } from "./hooks/useTokenCheck";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useTokenCheck(); // This runs on every page to check token validity

  return (
    <EmployeeProvider>
      <PermissionsProvider>
        <html lang="en">
          <head></head>
          <body className="relative">
            <SocketManager />
            {/* Hide Sidebar for paths containing 'auth' or for the root path '/' */}
            {!pathname.includes("auth") &&
              !pathname.includes("cv-preview") &&
              !pathname.includes("invoicePdf") &&
              !pathname.includes("privacy-policy") &&
              !pathname.includes("data-deletion") &&
              pathname !== "/" && <Sidebar />}
            {children}
          </body>
        </html>
      </PermissionsProvider>
    </EmployeeProvider>
  );
}
