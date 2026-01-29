// src/app/(your-folder)/auth/page.tsx
"use client";
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { usePermissions } from "@/app/contexts/permissionContext";
import { useEmployeeContext } from "@/app/contexts/employeeContext";
import Loader from "@/app/components/loader";
import { AdminLoginPayload, login } from "@/app/utils/auth";

export default function Auth() {
  const router = useRouter();
  const { fetchPermissions } = usePermissions();
  const { refetchEmployeeDetails } = useEmployeeContext();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values: AdminLoginPayload) => {
    setLoading(true);
    try {
      const data = await login("ADMIN", {
        email: values.email,
        password: values.password,
      });

      // data has { email, token, message }
      localStorage.setItem("token", (data as any).token);
      localStorage.setItem("email", (data as any).email);
      localStorage.setItem("role", "ADMIN");

      // Once stored, navigate
      router.push("/profile");
      // then re-fetch contexts
      await fetchPermissions();
      await refetchEmployeeDetails();
    } catch (err: any) {
      console.error("Login failed:", err?.response?.data?.error || err.message);
      alert(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Left Container */}
      <div className="hidden md:flex flex-[0.5] justify-center items-center bg-gradient-to-r from-blue-900 to-deepblue h-full">
        <img
          src="/europass.logo.png"
          alt="App Logo"
          className="object-contain"
          height={180}
          width={500}
        />
      </div>

      {/* Right Container */}
      <div className="flex flex-[0.5] justify-center items-center text-deepblue px-4 md:px-0 py-8 md:py-0 relative">
        <div className="absolute top-4 left-2 md:hidden">
          <img src="/logo.png" alt="App Logo" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-md mx-auto mt-4 md:mt-10">
          {/* Back Button */}
          <div
            className="h-[50px] text-blue-500 underline hover:text-deepblue py-5 cursor-pointer"
            onClick={() => router.back()}
          >
            Back
          </div>

          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
            Admin Login
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-6">
            Please enter your email and password to log in.
          </p>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                {/* Email */}
                <div className="relative">
                  <Field
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                  <span
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEye : faEyeSlash}
                    />
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-900 to-deepblue text-white font-semibold rounded-md hover:from-green-900 hover:to-parrotgreen transition duration-200"
                >
                  Log In
                </button>
              </Form>
            )}
          </Formik>

          {/* Forgot */}
          <div className="mt-6 text-center">
            <a
              href="/auth/forgotpassword"
              className="text-blue-500 hover:text-deepblue text-sm font-semibold"
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
