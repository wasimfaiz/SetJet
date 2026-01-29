"use client";
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    oldpass: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Old password is required"),
    newpass: yup
      .string()
      .min(8, "New password must be at least 8 characters")
      .matches(/[A-Z]/, "Must contain at least one uppercase letter")
      .matches(/[0-9]/, "Must contain at least one number")
      .required("New password is required"),
  });

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch("/api/auth/admin/forgot_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          oldPassword: values.oldpass,
          newPassword: values.newpass,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password changed successfully");
        router.push("/login"); // Navigate to login page after successful password change
      } else {
        console.error("Password change failed:", data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Left Container */}
      <div className="hidden md:flex flex-[1] justify-center items-center bg-gradient-to-r from-blue-900 to-deepblue h-full">
        <div className="pb-24">
          <img
            src="/europass.logo.png"
            alt="App Logo"
            className="object-contain"
            height={180}
            width={500}
          />
        </div>
      </div>

      {/* Right Container */}
      <div className="flex flex-[1] h-full flex-col justify-center items-center text-deepblue px-4 md:px-0 py-8 md:py-0 relative">
        <div className="absolute top-4 left-2 md:hidden">
          <img src="/logo.png" alt="App Logo" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-md mx-auto mt-4 md:mt-10">
          <div
            className="w-full text-blue-500 underline hover:text-deepblue cursor-pointer float-left"
            onClick={() => {
              router.back();
            }}
          >
            Back
          </div>
          <h1 className="text-xl md:text-2xl font-bold my-3 md:my-5">
            Forgot Password
          </h1>
          <Formik
            initialValues={{ email: "", oldpass: "", newpass: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4 md:space-y-6 mt-4">
                {/* Email Field */}
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-bloodred text-sm"
                  />
                </div>

                {/* Old Password Field */}
                <div className="relative">
                  <Field
                    type={showOldPassword ? "text" : "password"}
                    name="oldpass"
                    placeholder="Old Password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="oldpass"
                    component="div"
                    className="text-bloodred text-sm"
                  />
                  {/* Eye icon for toggling visibility */}
                  <span
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  >
                    {showOldPassword ? (
                      <FontAwesomeIcon icon={faEye} />
                    ) : (
                      <FontAwesomeIcon icon={faEyeSlash} />
                    )}
                  </span>
                </div>

                {/* New Password Field */}
                <div className="relative">
                  <Field
                    type={showNewPassword ? "text" : "password"}
                    name="newpass"
                    placeholder="New Password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="newpass"
                    component="div"
                    className="text-bloodred text-sm"
                  />
                  {/* Eye icon for toggling visibility */}
                  <span
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <FontAwesomeIcon icon={faEye} />
                    ) : (
                      <FontAwesomeIcon icon={faEyeSlash} />
                    )}
                  </span>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-900 to-deepblue text-white font-semibold rounded-md hover:from-green-900 hover:to-parrotgreen transition duration-200"
                  >
                    Reset Password
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Change Password Link */}
          <div className="mt-4 text-center">
            <a
              href="/auth/adminlogin"
              className="text-blue-500 underline hover:text-deepblue font-semibold cursor-pointer"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
