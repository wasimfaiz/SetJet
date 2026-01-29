"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "../contexts/permissionContext";

type RouteGuardProps = {
  children?: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[]; // Optional array of roles allowed access
};

const RouteGuard = ({
  children,
  requiredPermission,
  allowedRoles,
}: RouteGuardProps) => {
  const { permissions, role, loading, error } = usePermissions(); // Role now exists
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const hasRoleAccess = allowedRoles ? allowedRoles.includes(role) : true;
    const hasPermissionAccess =
      permissions === "all" ||
      (requiredPermission && permissions?.[requiredPermission]?.length > 0) ||
      requiredPermission === undefined;

    if (error || !hasRoleAccess || !hasPermissionAccess) {
      router.push("/profile"); // Redirect to profile if access is denied
    }
  }, [
    permissions,
    role,
    requiredPermission,
    allowedRoles,
    loading,
    error,
    router,
  ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default RouteGuard;
