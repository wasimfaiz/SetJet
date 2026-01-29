// app/hooks/usePersistentTab.ts
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function usePersistentTab(initialTab: string) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    // Build new URL string with updated query parameter
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    urlObj.searchParams.set("tab", tab);
    //@ts-ignore
    router.replace(urlObj.toString(), { shallow: true });
  };

  return { activeTab, changeTab };
}
