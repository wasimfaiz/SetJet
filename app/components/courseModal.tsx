/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";

interface CourseModalProps {
  show: boolean;
  onClose: () => void;
  onCourseChange: (item: string) => void;
}

const courseOptions = [
  { label: "BACHELORS", value: "BACHELORS", className: "bg-green-500 hover:bg-green-600 focus:ring-green-300" },
  { label: "MASTERS", value: "MASTERS", className: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300" },
  { label: "MBA", value: "MBA", className: "bg-red-400 hover:bg-red-600 focus:ring-red-300" },
  { label: "MBBS", value: "MBBS", className: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300" },
  { label: "MEDICAL", value: "MEDICAL", className: "bg-purple-500 hover:bg-purple-600 focus:ring-purple-300" },
  { label: "SPOKEN ENGLISH", value: "SPOKEN ENGLISH", className: "bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-300" },
  { label: "IELTS COURSE", value: "IELTS COURSE", className: "bg-pink-500 hover:bg-pink-600 focus:ring-pink-300" },
  { label: "TESTAS COURSE", value: "TESTAS COURSE", className: "bg-teal-500 hover:bg-teal-600 focus:ring-teal-300" },
  { label: "GERMAN LANGUAGE COURSE", value: "GERMAN LANGUAGE COURSE", className: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300" },
  { label: "WORKING VISA", value: "WORKING VISA", className: "bg-red-500 hover:bg-red-600 focus:ring-red-300" },
  { label: "OTHERS", value: "OTHERS", className: "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300" },
];

const CourseModal: React.FC<CourseModalProps> = ({ show, onClose, onCourseChange }) => {
  if (!show) return null;

  return (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg p-4 w-full max-w-xs md:max-w-md shadow-lg max-h-[80vh] overflow-y-auto">
      <h2 className="text-base font-semibold text-center mb-4 text-gray-800">
        Course looking for:
      </h2>

      {/* Course Options - 1 Column on Mobile, 2 Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {courseOptions.map((option, index) => (
          <button
            key={index}
            className={`w-full py-2 rounded-md text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200 ${option.className}`}
            onClick={() => onCourseChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        className="w-full py-2 rounded-md bg-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  </div>
  );
};

export default CourseModal;
