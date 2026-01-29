"use client";
import Image from "next/image";
import React, { useEffect } from "react";

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
  endYear: string;
}

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
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

interface TemplateFourProps {
  formData: FormData;
  selectedColor: string;
}

/* ────────────────────── SVG ICONS (same as TemplateThree) ────────────────────── */
const IconPhone = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1v3.49c0 .55-.45 1-1 1C9.25 21 3 14.75 3 7.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z"/>
  </svg>
);
const IconMail = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);
const IconMap = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);
const IconGlobe = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 17.5v-1.5c-1.48 0-2.82-.57-3.83-1.5.36-1.32.94-2.48 1.67-3.38.27-.33.68-.52 1.16-.52.48 0 .89.19 1.16.52.73.9 1.31 2.06 1.67 3.38-.99.93-2.33 1.5-3.83 1.5zm6.33-1.5c-.36 1.32-.94 2.48-1.67 3.38-.27.33-.68.52-1.16.52-.48 0-.89-.19-1.16-.52-.73-.9-1.31-2.06-1.67-3.38.99-.93 2.33-1.5 3.83-1.5v1.5z"/>
  </svg>
);
const IconLinkedIn = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3c0-1.73-.65-2.95-2.16-2.95-1.16 0-1.85.78-2.15 1.53v-1.28h-2.38v8h2.48v-4.3c0-1.13.27-2.22 1.7-2.22 1.4 0 1.41 1.33 1.41 2.36v4.16h2.48zm-12.15 0h2.48v-8h-2.48v8zm1.24-9.25c.8 0 1.3-.53 1.3-1.2 0-.68-.5-1.2-1.3-1.2-.81 0-1.31.52-1.31 1.2 0 .67.5 1.2 1.31 1.2z"/>
  </svg>
);

/* ────────────────────── BULLET RENDERER (same as TemplateThree) ────────────────────── */
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

export default function TemplateFour({ formData }: TemplateFourProps) {
  if (!formData) {
    return <p className="text-center text-gray-500 mt-10">No data available for this CV.</p>;
  }

const sectionTitleStyle: React.CSSProperties = {
  backgroundColor: "#00B7EB",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingTop: "2px",
  height: "38px",
  lineHeight: "1.1",
  textAlign: "center",
  color: "white",
  textTransform: "uppercase",
  fontWeight: 800,
  fontSize: "1.125rem",
};


  return (
    <>
    
      {/* ────────────────────── A4 EXACT CONTAINER ────────────────────── */}
      <div
        className="w-[210mm] bg-white font-sans text-sm"
        style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: "1.4" }}
      >
        <div className="flex">
          {/* LEFT SIDEBAR */}
          <aside className="w-2/5 bg-gray-900 text-white p-6 flex flex-col items-center justify-start">
    {/* Avatar */}
    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white mb-6">
      {formData.avatar ? (
        <Image
          src={formData.avatar}
          alt="Profile"
          width={112}
          height={112}
          className="w-full h-full object-cover rounded-full"
          unoptimized
          crossOrigin="anonymous"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-700">
          👤
        </div>
      )}
    </div>

    {/* Contact Section */}
    <section className="w-full space-y-3 text-left">
      <h2 style={sectionTitleStyle}>Contact</h2>
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

    {/* Skills */}
    {(formData.skills ?? []).length > 0 && (
  <section className="mt-8 w-full text-left page">
     <h2 style={sectionTitleStyle}>Skills</h2>
    <div className="mt-3 text-sm space-y-2 text-gray-100 print:text-black">
      {formData.skills!.map((skill, idx) => (
        <div key={idx} className="flex items-start gap-0">
          <span className="w-5 text-center flex-shrink-0 mt-0.5">•</span>
          <span className="flex-1 break-words hyphens-auto">{skill}</span>
            </div>
          ))}
        </div>
      </section>
    )}
  </aside>

          {/* RIGHT MAIN CONTENT */}
          <main className="w-3/5 bg-white p-8 page">
            {/* Name + Profession */}
            <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wide print:text-black">
              {formData.firstName || "First"}{" "}
              <span style={{ color: "#00B7EB" }}>{formData.lastName || "Last"}</span>
            </h1>

            {/* About / Summary */}
            {formData.about && (
              <p className="text-sm text-gray-700 mb-8 leading-relaxed hyphens-auto print:text-black">
                {formData.about}
              </p>
            )}

            {/* Work Experience */}
            {(formData.workExperience ?? []).length > 0 && (
              <section className="mb-8 page">
                <h2 style={sectionTitleStyle}>Work Experience</h2>
                {formData.workExperience!.map((work, idx) => (
                  <div key={idx} className="mb-6 mt-4 page">
                    <p className="font-semibold text-gray-900 print:text-black">{work.position}</p>
                    <p className="text-sm text-gray-900 print:text-black">{work.company}</p>
                    <p className="text-sm text-gray-500 print:text-black mb-2">
                      {work.startDate} – {work.endDate || "Present"}
                    </p>
                    <div className="mt-2 space-y-1">{renderBullet(work.description)}</div>
                  </div>
                ))}
              </section>
            )}

            {/* Education */}
           {Array.isArray(formData.education) && formData.education.length > 0 && (
              <section className="mb-6 page">
               <h2 style={sectionTitleStyle}>Education</h2>
               
                {formData.education.map((e: any, i: number) => (
                  <div key={i} className="flex items-start gap-0 pl-1 mb-3 mt-4 page">
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
            {(formData.projects ?? []).length > 0 && (
              <section
                className={`
                  page
                  ${(formData.workExperience ?? []).length > 0 || (formData.education ?? []).length > 0 ? 'page-break-before' : ''}
                `}
              >
               <h2 style={sectionTitleStyle}>Project</h2>
                {formData.projects!.map((proj, i) => (
                  <div key={i} className="mb-6 mt-4 page">
                    <p className="font-semibold text-sm text-gray-900 print:text-black print:border-b-1">
                      {proj.title}
                    </p>
                    {proj.description && (
                      <div className="mt-2 space-y-1">{renderBullet(proj.description)}</div>
                    )}
                  </div>
                ))}
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}