// hooks/useTokenCheck.ts
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

export function useTokenCheck() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    // Clear everything
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    // Force redirect
    router.replace("/");
  };

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      logout();
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now) {
        console.info("Token expired at", new Date(decoded.exp * 1000));
        logout();
      }
    } catch (error) {
      console.error("Invalid JWT:", error);
      logout();
    }
  };

  useEffect(() => {
    checkToken();
    intervalRef.current = setInterval(checkToken, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  return { logout };
}