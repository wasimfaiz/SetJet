// app/hooks/usePersistentView.ts
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function usePersistentView(initialView: string) {
  const router = useRouter();
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view) {
      setActiveView(view);
    }
  }, []);

  const changeView = (view: string) => {
    setActiveView(view);
    // Build new URL string with updated query parameter
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    urlObj.searchParams.set("view", view);
    //@ts-ignore
    router.replace(urlObj.toString(), { shallow: true });
  };

  return { activeView, changeView };
}
