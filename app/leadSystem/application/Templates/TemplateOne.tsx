"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

/* ────────────────────── SVG ICONS ────────────────────── */
const IconPhone = () => (
 <svg className="w-5 h-5 flex-shrink-0 mr-1 print:mr-1" viewBox="0 0 24 24" fill="currentColor">
  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1v3.49c0 .55-.45 1-1 1C9.25 21 3 14.75 3 7.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z"/>
</svg>
);
const IconMail = () => (
 <svg className="w-5 h-5 flex-shrink-0 mr-1 print:mr-1" viewBox="0 0 24 24" fill="currentColor">
  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
</svg>
);
const IconMap = () => (
  <svg className="w-5 h-5 flex-shrink-0 mr-1 print:mr-1" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
);
const IconGlobe = () => (
  <svg className="w-5 h-5 flex-shrink-0 mr-1 print:mr-1" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 17.5v-1.5c-1.48 0-2.82-.57-3.83-1.5.36-1.32.94-2.48 1.67-3.38.27-.33.68-.52 1.16-.52.48 0 .89.19 1.16.52.73.9 1.31 2.06 1.67 3.38-.99.93-2.33 1.5-3.83 1.5zm6.33-1.5c-.36 1.32-.94 2.48-1.67 3.38-.27.33-.68.52-1.16.52-.48 0-.89-.19-1.16-.52-.73-.9-1.31-2.06-1.67-3.38.99-.93 2.33-1.5 3.83-1.5v1.5z"/>
</svg>
);
const IconLinkedIn = () => (
  <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3c0-1.73-.65-2.95-2.16-2.95-1.16 0-1.85.78-2.15 1.53v-1.28h-2.38v8h2.48v-4.3c0-1.13.27-2.22 1.7-2.22 1.4 0 1.41 1.33 1.41 2.36v4.16h2.48zm-12.15 0h2.48v-8h-2.48v8zm1.24-9.25c.8 0 1.3-.53 1.3-1.2 0-.68-.5-1.2-1.3-1.2-.81 0-1.31.52-1.31 1.2 0 .67.5 1.2 1.31 1.2z"/>
  </svg>
);

/* ────────────────────── MAIN COMPONENT ────────────────────── */
interface TemplateOneProps {
  formData: any;
  selectedColor: string;
}
export default function TemplateOne({ formData, selectedColor }: TemplateOneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    if (formData?.avatar) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = formData.avatar;
      img.onload = () => setAvatarLoaded(true);
      img.onerror = () => setAvatarLoaded(true);
    } else setAvatarLoaded(true);
  }, [formData?.avatar]);

  if (!formData) return <p className="text-center text-gray-500 mt-20">No CV data available</p>;

const renderBullet = (txt?: string) => {
  if (!txt) return null;

  const points = txt
    .split(/\d+\.\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  return points.map((point, i) => (
    <div
      key={i}
      className="flex items-start gap-0 pl-1 page-break-inside-avoid"
    >
      <span className="text-lg leading-none flex-shrink-0 mt-0.5 w-4 pl-1">•</span>
      <span className="flex-1 hyphens-auto break-words whitespace-pre-wrap leading-relaxed text-justify">
        {point}
      </span>
    </div>
  ));
};

  return (
    <>
      {/* A4 EXACT CONTAINER – NO MIN‑HEIGHT */}
      <div
  ref={containerRef}
  className="w-[210mm] bg-white font-sans text-sm"
 style={{ 
    fontFamily: "'Times New Roman', Times, serif", 
    lineHeight: "1.4"  // Perfect for Times New Roman
  }}
>
<div className="print-a4-force">
        <div className="flex">
          {/* LEFT SIDEBAR */}
          <aside className="w-2/5 bg-gray-200  p-6 flex flex-col items-center page">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow mb-4">
              {formData.avatar && avatarLoaded ? (
                <Image
                  src={formData.avatar}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-600 text-white text-5xl">
                  ?
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-xl font-bold text-center mb-6 print:text-black">
              {formData.firstName} {formData.lastName}
            </h1>

            {/* CONTACT – PERFECT ALIGNMENT */}

<section className="w-full space-y-3 text-left page">
  <h2 className="font-bold text-lg mb-2 print:text-black ml-2 ">Contact</h2>

  {/* City */}
  {formData.address && (
    <div className="flex items-center gap-2 print:text-black mt-2">
      <div className="w-5 h-5 flex justify-center items-center flex-shrink-0">
        <svg className="w-5 h-5 flex-shrink-0 mr-1 print:mr-1" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
      </div>
      <span className="break-words leading-none mb-4">{formData.address.city}, {formData.address.country}</span>
    </div>
  )}

  {/* Phone */}
  <div className="flex items-center gap-2 print:text-black">
    <div className="w-5 h-5 flex justify-center items-center flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1v3.49c0 .55-.45 1-1 1C9.25 21 3 14.75 3 7.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z"/>
      </svg>
    </div>
    <span className="break-words leading-none mb-4">{formData.phone}</span>
  </div>

  {/* LinkedIn */}
  {formData.linkedin && (
    <div className="flex items-center gap-2 print:text-black print:no-underline mt-2">
      <div className="w-5 h-5 flex justify-center items-center flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3c0-1.73-.65-2.95-2.16-2.95-1.16 0-1.85.78-2.15 1.53v-1.28h-2.38v8h2.48v-4.3c0-1.13.27-2.22 1.7-2.22 1.4 0 1.41 1.33 1.41 2.36v4.16h2.48zm-12.15 0h2.48v-8h-2.48v8zm1.24-9.25c.8 0 1.3-.53 1.3-1.2 0-.68-.5-1.2-1.3-1.2-.81 0-1.31.52-1.31 1.2 0 .67.5 1.2 1.31 1.2z"/>
        </svg>
      </div>
      <span className="break-words leading-none mb-4">{formData.linkedin}</span>
    </div>
  )}

  {/* Email */}
  <div className="flex items-center gap-2 print:text-black print:no-underline mt-2">
    <div className="w-5 h-5 flex justify-center items-center flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    </div>
    <span className="break-words leading-none mb-4">{formData.email}</span>
  </div>
</section>

            {/* SKILLS */}
            {formData.skills?.length > 0 && (
              <section className="w-full mt-6 page">
                <h2 className="font-bold text-lg mb-2 print:text-black">Skills</h2>
                <ul className="list-none space-y-1">
                  {formData.skills.map((s: string, i: number) => (
                    <li key={i} className="flex items-center print:text-black">
                      <span className="w-5 text-center">•</span>
                      <span className="flex-1 break-words">{s}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          {/* RIGHT COLUMN */}
          <main className="w-3/5 p-10 page">
            {/* Profile */}
            {formData.about && (
              <section className="mb-6 page">
                <h2 className="font-bold text-lg mb-2 print:text-black">Profile</h2>
                <p className="print:text-black break-words">{formData.about}</p>
              </section>
            )}

            {/* Work Experience */}
            {formData.workExperience?.length > 0 && (
              <section className="mb-6 page">
                <h2 className="font-bold text-lg mb-3 print:text-black">Work Experience</h2>
                {formData.workExperience.map((w: any, i: number) => (
                  <div key={i} className="mb-6 page">
    <p className="font-semibold">{w.position}</p>
    <p className="font-medium">{w.company}</p>
    <p className="text-xs text-gray-600">{w.startDate} – {w.endDate || "Present"}</p>
    <div className="mt-2 space-y-1">{renderBullet(w.description)}</div>
  </div>
                ))}
              </section>
            )}

            {/* Education */}
           {formData.education?.length > 0 && (
<section className="mb-6 page">
    <h2 className="font-bold text-lg mb-3 print:text-black">Education</h2>
    {formData.education.map((e: any, i: number) => (
      <div key={i} className="flex items-start gap-0 pl-1 mb-3 page"> 
        <span className="text-lg leading-none flex-shrink-0 mt-0.5 w-4">•</span>
        <div className="flex-1">
          <p className="font-semibold print:text-black">{e.institution}</p>
          <p className="text-sm print:text-black">{e.degree}</p>
          <p className="text-xs text-gray-600 print:text-black">
            {e.startYear} – {e.endYear}
          </p>
        </div>
      </div>
    ))}
  </section>
)}

            {/* Projects */}
          
{formData.projects?.length > 0 && (
  <section
    className={`
      mb-6 page
      ${formData.workExperience?.length > 0 || formData.education?.length > 0 ? 'page-break-before' : ''}
    `}
  >
    <h2 className="font-bold text-lg mb-3 print:text-black print:mt-28">
      Projects
    </h2>
    {formData.projects.map((p: any, i: number) => (
      <div key={i} className="mb-6 page">
        <p className="font-semibold print:text-black">{p.title}</p>
        <div className="mt-2 space-y-1">{renderBullet(p.description)}</div>
      </div>
    ))}
  </section>
)}
          </main>
        </div>
      </div>
      </div>
    </>
  );
}