"use client"
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPhone,
  faMapMarkerAlt,
  faIdCard,
  faCalendarAlt,
  faEdit
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/app/components/loader";
import RouteGuard from "@/app/components/routegaurd";
import apiClient from "@/app/utils/apiClient";

interface Schedule { day: string; time: string; }
interface StudentBatch { id: string; name: string; schedules: Schedule[]; }
interface Student {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  address: string;
  aadhar: string | null;
  regDate: string;
  dob: string;
  batches: StudentBatch[];
}

const StudentDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = useParams();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Student>(`/api/students?id=${id}`);
        setStudent(res.data);
      } catch {
        setError("Unable to load student details.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);
  const handleEdit = () => {
    router.push(`/coachingSystem/student/add?id=${id}`);
  };
  if (loading) return <Loader />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  return (
    <RouteGuard requiredPermission="student">
      <div className="container p-6 space-y-8">
        <header className="flex justify-between items-center">
          <Link href="/coachingSystem/student" className="text-blue-600 hover:underline">
            &larr; Back
          </Link>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow-md space-y-4">
            <div className="w-full flex justify-between">
              <h2 className="text-xl font-semibold text-gray-700">Personal Info</h2>
              <button
                onClick={handleEdit}
                className="flex items-center text-deepblue hover:text-blue-700"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                Edit
              </button>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                {student.name}
              </li>
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                {student.phoneNumber}
              </li>
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                Parent: {student.parentPhoneNumber}
              </li>
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                {student.address}
              </li>
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                DOB: {student.dob}
              </li>
              <li className="flex items-center text-gray-600">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Registered: {student.regDate}
              </li>
              <li className="flex flex-col items-start text-gray-600">
                <span className="flex">
                  <FontAwesomeIcon icon={faIdCard} className="mr-2" />
                    Aadhaar: 
                  <img src={student?.aadhar || "/aadhar.png"}/>
                </span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-md space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Enrolled Batches</h2>
            {student.batches.length === 0 ? (
              <p className="text-gray-500">No batches assigned.</p>
            ) : (
              <div className="space-y-4">
                {student.batches.map(batch => (
                  <div key={batch.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {batch.name}
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc list-inside text-gray-600">
                      {batch.schedules.map((s, idx) => (
                        <li key={idx}>{s.day} @ {s.time}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </RouteGuard>
  );
};

export default StudentDetailPage;
