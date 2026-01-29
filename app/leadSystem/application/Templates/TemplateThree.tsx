"use client";

import Image from "next/image";
import React, { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* -------------------- Interfaces -------------------- */
interface Address {
  type?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}
interface Education {
  degree: string;
  institution: string;
  startYear: string;
  endYear?: string;
}
interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}
interface Project {
  title: string;
  description?: string;
}
interface FormData {
  linkedin?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  about?: string;
  email?: string;
  phone?: string;
  profession?: string;
  address?: Address;
  avatar?: string | null;
  education?: Education[];
  workExperience?: WorkExperience[];
  skills?: string[];
  projects?: Project[];
}
interface TemplateThreeProps {
  formData: FormData;
  selectedColor?: string;
}

/* -------------------- Small SVG icons -------------------- */
const IconPhone = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1v3.49c0 .55-.45 1-1 1C9.25 21 3 14.75 3 7.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z" />
  </svg>
);
const IconMail = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);
const IconGlobe = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 17.5v-1.5c-1.48 0-2.82-.57-3.83-1.5.36-1.32.94-2.48 1.67-3.38.27-.33.68-.52 1.16-.52.48 0 .89.19 1.16.52.73.9 1.31 2.06 1.67 3.38-.99.93-2.33 1.5-3.83 1.5zm6.33-1.5c-.36 1.32-.94 2.48-1.67 3.38-.27.33-.68.52-1.16.52-.48 0-.89-.19-1.16-.52-.73-.9-1.31-2.06-1.67-3.38.99-.93 2.33-1.5 3.83-1.5v1.5z" />
  </svg>
);
const IconLinkedIn = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3c0-1.73-.65-2.95-2.16-2.95-1.16 0-1.85.78-2.15 1.53v-1.28h-2.38v8h2.48v-4.3c0-1.13.27-2.22 1.7-2.22 1.4 0 1.41 1.33 1.41 2.36v4.16h2.48zm-12.15 0h2.48v-8h-2.48v8zm1.24-9.25c.8 0 1.3-.53 1.3-1.2 0-.68-.5-1.2-1.3-1.2-.81 0-1.31.52-1.31 1.2 0 .67.5 1.2 1.31 1.2z" />
  </svg>
);

/* ---------- helpers ---------- */
const mmToPx = (mm: number) => (mm * 96) / 25.4;

/* ---------- bullet renderer (keeps your bullet formatting) ---------- */
const renderBullet = (txt?: string) => {
  if (!txt) return null;
  const points = txt
    .split(/\d+\.\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return points.map((point, i) => (
    <div key={i} className="flex items-start gap-1">
      <span className="text-lg mt-0.5 w-4">•</span>
      <span className="flex-1 break-words leading-snug">{point}</span>
    </div>
  ));
};

/* -------------------- Component -------------------- */
export default function TemplateThree({
  formData,
  selectedColor = "#FDC500",
}: TemplateThreeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- wait for fonts/images ---------------- */
  const waitForImagesAndFonts = async (root: HTMLElement) => {
    // fonts
    if ((document as any).fonts && (document as any).fonts.ready) {
      try {
        await (document as any).fonts.ready;
      } catch (e) {}
    }
    // images
    const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((res) => {
          img.onload = img.onerror = () => res();
        });
      })
    );
  };

  /* ---------------- pagination effect (creates A4 pages) ---------------- */
  useEffect(() => {
    if (!formData) return;
    const root = rootRef.current;
    if (!root) return;

    // remove previous pages if present
    root.querySelectorAll(".a4-page").forEach((n) => n.remove());

    // create a hidden measuring root
    const tempRoot = document.createElement("div");
    tempRoot.style.position = "absolute";
    tempRoot.style.left = "-99999px";
    tempRoot.style.top = "0";
    tempRoot.style.width = "210mm";
    tempRoot.style.boxSizing = "border-box";
    tempRoot.style.zIndex = "-1";
    document.body.appendChild(tempRoot);

    // helper to create section nodes
    const createSectionNode = (html: string, sectionName: string) => {
      const wrapper = document.createElement("div");
      wrapper.className = "cv-section-block";
      wrapper.dataset.section = sectionName;
      wrapper.style.boxSizing = "border-box";
      wrapper.innerHTML = html;
      return wrapper;
    };

    // Build HTML strings for sections using same design (keeps CSS identical)
    const headerHTML = `
      <div class="cv-header" style="background:#000;color:#fff;padding:16px;">
        <h1 style="margin:0;font-size:22px;letter-spacing:1px">${
          (formData.firstName || "") + " " + (formData.lastName || "")
        }</h1>
        ${
          formData.profession
            ? `<div style="margin-top:6px;font-size:13px">${formData.profession}</div>`
            : ""
        }
      </div>
    `;

    let experienceHTML = `<div class="cv-experience" style="padding:12px 0"><h2 style="margin:0 0 8px 0;font-weight:700;text-transform:uppercase">Experience</h2>`;
    (formData.workExperience || []).forEach((w) => {
      experienceHTML += `<div class="exp-item" style="margin-bottom:10px">
        <div style="font-weight:700">${w.position || ""}</div>
        <div style="font-size:12px">${w.company || ""}</div>
        <div style="font-size:11px;color:#555">${w.startDate || ""} – ${
        w.endDate || "Present"
      }</div>
        <div style="margin-top:6px">${w.description || ""}</div>
      </div>`;
    });
    experienceHTML += `</div>`;

    let educationHTML = `<div class="cv-education" style="padding:12px 0"><h2 style="margin:0 0 8px 0;font-weight:700;text-transform:uppercase">Education</h2><div style="position:relative;padding-left:18px"><div style="position:absolute;left:6px;top:4px;bottom:0;width:2px;background:#000;border-radius:2px"></div>`;
    (formData.education || []).forEach((edu) => {
      educationHTML += `<div class="edu-item" style="position:relative;padding:6px 0 12px 12px">
        <div style="position:absolute;left:-8px;top:8px;width:10px;height:10px;border-radius:999px;background:${selectedColor};border:3px solid #fff"></div>
        <div style="font-weight:700">${edu.degree || ""}</div>
        <div style="font-size:12px">${edu.institution || ""}</div>
        <div style="font-size:11px;color:#555">${edu.startYear || ""} – ${
        edu.endYear || ""
      }</div>
      </div>`;
    });
    educationHTML += `</div></div>`;

    let projectsHTML = `<div class="cv-projects" style="padding:12px 0"><h2 style="margin:0 0 8px 0;font-weight:700;text-transform:uppercase">Projects</h2>`;
    (formData.projects || []).forEach((p) => {
      projectsHTML += `<div class="proj-item" style="margin-bottom:10px"><div style="font-weight:700">${
        p.title || ""
      }</div><div style="margin-top:6px">${p.description || ""}</div></div>`;
    });
    projectsHTML += `</div>`;

    const sidebarHTML = `
      <aside style="width:70mm;box-sizing:border-box;padding:18px;background:${selectedColor};display:flex;flex-direction:column;gap:12px;color:#000">
        <div style="width:96px;height:96px;border-radius:999px;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center;font-size:36px">
          ${
            formData.avatar
              ? `<img src="${formData.avatar}" style="width:100%;height:100%;object-fit:cover" />`
              : (formData.firstName?.[0] || "?") +
                (formData.lastName?.[0] || "")
          }
        </div>
        ${
          formData.about
            ? `<div><div style="font-weight:700;margin-bottom:6px">Profile</div><div style="font-size:12px">${formData.about}</div></div>`
            : ""
        }
        <div><div style="font-weight:700;margin-bottom:6px">Contact</div>
          ${
            formData.phone
              ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><div style="font-size:12px">${formData.phone}</div></div>`
              : ""
          }
          ${
            formData.email
              ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><div style="font-size:12px">${formData.email}</div></div>`
              : ""
          }
          ${
            formData.website
              ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><div style="font-size:12px">${formData.website}</div></div>`
              : ""
          }
        </div>
        ${
          formData.skills && formData.skills.length > 0
            ? `<div><div style="font-weight:700;margin-bottom:6px">Skills</div><div style="display:flex;flex-wrap:wrap;gap:6px">${formData.skills
                .map(
                  (s) =>
                    `<span style="background:#fff;padding:6px 8px;border-radius:6px;font-size:12px">${s}</span>`
                )
                .join("")}</div></div>`
            : ""
        }
      </aside>
    `;

    const blocks = [
      createSectionNode(headerHTML, "header"),
      createSectionNode(experienceHTML, "experience"),
      createSectionNode(educationHTML, "education"),
      createSectionNode(projectsHTML, "projects"),
    ];
    blocks.forEach((b) => tempRoot.appendChild(b));

    // wait for assets inside tempRoot
    (async () => {
      await waitForImagesAndFonts(tempRoot);

      // pagination constants
      const pageInnerHeightPx = Math.round(mmToPx(297) - mmToPx(24)); // account for top+bottom padding 12mm each

      // factory to create page element inside the real root (we will append clones later)
      const createPageElement = (withAside: boolean) => {
        const page = document.createElement("div");
        page.className = "a4-page";
        page.style.width = "210mm";
        page.style.minHeight = "297mm";
        page.style.boxSizing = "border-box";
        page.style.padding = "12mm";
        page.style.display = "flex";
        page.style.flexDirection = "row";
        page.style.gap = "12mm";
        page.style.background = "#fff";

        if (withAside) {
          const asideEl = document.createElement("div");
          asideEl.style.flex = "0 0 70mm";
          asideEl.style.maxWidth = "70mm";
          asideEl.style.boxSizing = "border-box";
          asideEl.innerHTML = sidebarHTML;
          page.appendChild(asideEl);
        }
        const main = document.createElement("div");
        main.className = "a4-main-col";
        main.style.flex = "1 1 auto";
        main.style.minHeight = "0";
        page.appendChild(main);
        return page;
      };

      // build pages in a temporary array (we'll clone into the visible root afterwards)
      const pagesBuilt: HTMLElement[] = [];
      let currentPage = createPageElement(true);
      pagesBuilt.push(currentPage);

      for (const child of Array.from(tempRoot.children) as HTMLElement[]) {
        const blockClone = child.cloneNode(true) as HTMLElement;
        const mainCol = currentPage.querySelector<HTMLElement>(".a4-main-col")!;
        mainCol.appendChild(blockClone);

        // allow layout settle
        await new Promise((r) => setTimeout(r, 30));
        if (mainCol.scrollHeight > pageInnerHeightPx) {
          const isEducation = blockClone.dataset.section === "education";
          const alreadyHasContent = mainCol.childElementCount > 1;
          if (isEducation && alreadyHasContent) {
            mainCol.removeChild(blockClone);
            // new page without aside
            currentPage = createPageElement(false);
            currentPage.style.paddingTop = "14mm";
            pagesBuilt.push(currentPage);
            currentPage
              .querySelector<HTMLElement>(".a4-main-col")!
              .appendChild(blockClone);
          } else {
            if (blockClone.scrollHeight > pageInnerHeightPx) {
              // too big for single page: keep it (rare)
              console.warn(
                "Block bigger than a page:",
                blockClone.dataset.section
              );
            } else {
              mainCol.removeChild(blockClone);
              currentPage = createPageElement(false);
              currentPage.style.paddingTop = "14mm";
              pagesBuilt.push(currentPage);
              currentPage
                .querySelector<HTMLElement>(".a4-main-col")!
                .appendChild(blockClone);
            }
          }
        }
      }

      // append clones of pagesBuilt into the visible root (preserving your original design)
      // first remove any existing generated pages
      root.querySelectorAll(".a4-page").forEach((n) => n.remove());

      for (let i = 0; i < pagesBuilt.length; i++) {
        const visibleClone = pagesBuilt[i].cloneNode(true) as HTMLElement;
        if (i > 0) visibleClone.style.paddingTop = "14mm"; // extra top padding page 2+
        root.appendChild(visibleClone);
      }

      // cleanup tempRoot after a short delay to ensure visible clones painted
      setTimeout(() => {
        try {
          tempRoot.remove();
        } catch (e) {}
      }, 500);
    })();

    // cleanup on unmount
    return () => {
      root.querySelectorAll(".a4-page").forEach((n) => n.remove());
      try {
        tempRoot.remove();
      } catch (e) {}
    };
  }, [formData, selectedColor]);

  /* ---------------- improved PDF exporter (captures each .a4-page) ---------------- */
  const handleDownloadPDF = async () => {
    const root = rootRef.current;
    if (!root) return alert("CV not ready");

    const pages = Array.from(root.querySelectorAll<HTMLElement>(".a4-page"));
    if (!pages.length) return alert("No A4 pages found to export");

    // wait for assets inside each visible page
    for (const p of pages) {
      await waitForImagesAndFonts(p);
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      // normalize links
      p.querySelectorAll("a").forEach((a) => {
        try {
          (a as HTMLElement).style.color = "black";
          (a as HTMLElement).style.textDecoration = "none";
        } catch (e) {}
      });

      p.style.overflow = "hidden";
      // tiny wait to ensure render
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));

      // capture
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(p, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pdfW) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgHeight);
    }

    pdf.save(`${formData.firstName || "CV"}_${formData.lastName || ""}.pdf`);
  };

  /* ---------------- visible UI: Download button + container where A4 pages are appended ---------------- */
  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-deepblue text-white rounded"
        >
          Download A4 PDF
        </button>
      </div>

      {/* This container will receive .a4-page nodes created by the effect above (no permanent DOM changes to your original page design). */}
      <div id="CV" ref={rootRef} />
    </>
  );
}
