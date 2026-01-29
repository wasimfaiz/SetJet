"use client";
import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useRouter } from "next/navigation";

export default function Auth() {
  const router = useRouter();

  const validationSchema = yup.object().shape({
    role: yup.string().required("Role is required"),
  });

  const handleSubmit = async (values: any) => {
    try {
      if (values.role === "admin") {
        router.push("/auth/adminlogin");
      } else if (values.role === "employee") {
        router.push("/auth/employeelogin");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Left Container (hidden on mobile) */}
      <div className="hidden md:flex flex-[0.5] justify-center items-center bg-gradient-to-r from-blue-900 to-deepblue h-full">
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
      <div className="flex flex-[0.5] h-full justify-center items-center text-deepblue px-4 md:px-0 py-8 md:py-0 relative">
        {/* Logo in the top-left corner for mobile */}
        <div className="absolute top-4 left-2 md:hidden">
          <img src="/logo.png" alt="App Logo" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-md mx-auto mt-4 md:my-10">
          <h1 className="text-xl md:text-2xl font-bold my-3 md:my-5">
            Login As
          </h1>
          <p className="text-gray-600 text-sm md:text-base md:mb-5">
            Please select your role
          </p>

          <Formik
            initialValues={{ role: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                {/* Role Selection */}
                <div className="relative">
                  <Field
                    as="select"
                    name="role"
                    className="w-full py-3 md:py-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </Field>
                  <ErrorMessage
                    name="role"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-900 to-deepblue text-white font-semibold rounded-md hover:from-green-900 hover:to-parrotgreen transition duration-200"
                  >
                    Continue
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
