"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function usePersistentPage(initialPage: number = 1) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // On mount, load the current page from localStorage (or from the query string if available)
  useEffect(() => {
    const queryPage = searchParams.get("page");
    if (queryPage) {
      setCurrentPage(Number(queryPage));
      localStorage.setItem("currentPage", queryPage);
    } else {
      const storedPage = localStorage.getItem("currentPage");
      if (storedPage) {
        setCurrentPage(Number(storedPage));
      } else {
        setCurrentPage(initialPage);
      }
    }
  }, [initialPage, searchParams]);

  // Function to update the page both in state and in localStorage (and optionally update URL query)
  const changePage = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem("currentPage", String(page));
    // Optionally update the query parameter in the URL:
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  return { currentPage, changePage };
}
