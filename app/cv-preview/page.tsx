// app/cv-preview/CVPreviewClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Loader from "@/app/components/loader";
import { Suspense } from "react";

/**
 * Dynamic client-only template imports (ssr: false).
 * Keeps heavy/browser-only template code out of server prerender.
 */
const TemplateOne = dynamic(
  () => import("../leadSystem/application/Templates/TemplateOne"),
  { ssr: false }
);
const TemplateTwo = dynamic(
  () => import("../leadSystem/application/Templates/TemplateTwo"),
  { ssr: false }
);
const TemplateThree = dynamic(
  () => import("../leadSystem/application/Templates/TemplateThree"),
  { ssr: false }
);
const TemplateFour = dynamic(
  () => import("../leadSystem/application/Templates/TemplateFour"),
  { ssr: false }
);

const renderTemplate = (id: number, formData: any, selectedColor: string) => {
  switch (id) {
    case 1:
      return <TemplateOne formData={formData} selectedColor={selectedColor} />;
    case 2:
      return <TemplateTwo formData={formData} selectedColor={selectedColor} />;
    case 3:
      return (
        <TemplateThree formData={formData} selectedColor={selectedColor} />
      );
    case 4:
      return <TemplateFour formData={formData} selectedColor={selectedColor} />;
    default:
      return <p className="text-gray-500">Invalid template</p>;
  }
};

function CVPreviewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>("#1E40AF");

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    if (!id) {
      setError("No id provided in query string.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchApp() {
      setLoading(true);
      try {
        const token = getToken();
        const res = await axios.get(`/api/application?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const appData = res.data;
        if (!appData) {
          if (!cancelled) {
            setApplication(null);
            setError("Application not found.");
          }
          return;
        }

        const flattenedFormData = {
          ...(appData.formData?.step1 || {}),
          ...(appData.formData?.step2 || {}),
          ...(appData.formData?.step3 || {}),
          ...(appData.formData?.step4 || {}),
          ...(appData.formData?.step5 || {}),
          ...(appData.formData?.step6 || {}),
        };

        const templateIdFromStep =
          appData.formData?.step6?.cvTemplate?.templateId;
        const metadataTemplate = appData?.metadata?.templateId;
        const resolvedTemplate = metadataTemplate || templateIdFromStep || 1;

        if (!cancelled) {
          setSelectedTemplate(resolvedTemplate);
          if (appData?.metadata?.selectedColor)
            setSelectedColor(appData.metadata.selectedColor);

          setApplication({
            ...appData,
            formData:
              Object.keys(flattenedFormData).length > 0
                ? flattenedFormData
                : appData.formData,
          });
        }
      } catch (err) {
        console.error("Failed to fetch application for CV preview:", err);
        if (!cancelled) setError("Failed to load application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchApp();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadPDF = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const appId = application?._id || id;
    if (!token) return alert("You must be logged in to download the CV");
    if (!appId) return alert("No application id available to download");

    window.open(`/api/pdf/cv?id=${appId}&token=${token}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <button className="text-deepblue mb-4" onClick={() => router.back()}>
          Back
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <button className="text-deepblue mb-4" onClick={() => router.back()}>
          Back
        </button>
        <p className="text-gray-600">No application found for preview.</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold">CV Preview</h2>
        </div>
        <div>
          <button
            onClick={downloadPDF}
            className="rounded bg-deepblue px-3 py-1 text-white"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div id="CV_PREVIEW" className="p-6">
        {renderTemplate(
          selectedTemplate,
          application.formData || {},
          selectedColor
        )}
      </div>
    </div>
  );
}
// app/cv-preview/page.tsx

/**
 * Import the client component lazily on the server so we don't force evaluation
 * at build-time. We could also direct import, but dynamic import keeps
 * server bundle smaller in some cases.
 */

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-[70vh] flex items-center justify-center">
          Loading preview…
        </div>
      }
    >
      <CVPreviewClient />
    </Suspense>
  );
}
