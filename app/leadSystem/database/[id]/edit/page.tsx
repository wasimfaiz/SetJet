"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddEdit from "@/app/components/addedit";
import { contacts } from "@/app/utils/validation.utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";

const ContactAddPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialData, setInitialData] = useState(null);
  const [employees, setEmployees] = useState<any[]>([]); // Initialize as an array
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true); // Set loading true when fetching employees
    try {
      const response = await apiClient.get(`/api/employees?status=ACTIVE`);
      let employeesData = response.data || [];

      // Map the data into { label, value } format
      const segmentedData = employeesData.map((employee: any) => ({
        label: employee.basicField.name,
        value: employee._id,
      }));

      setEmployees(segmentedData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false); // Set loading to false after employee data is fetched
    }
  };

  // Define form fields
  const contactFields = [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "Email",
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "text",
      placeholder: "Mobile",
    },
    {
      label: "State",
      name: "state",
      type: "text",
      placeholder: "State",
    },
    {
      label: "Status",
      name: "status",
      type: "select",
      options: [
        { label: "CONVERTED", value: "CONVERTED" },
        { label: "PAYMENT MODE", value: "PAYMENT MODE" },
        { label: "INTERESTED", value: "INTERESTED" },
        { label: "NOT INTERESTED", value: "NOT INTERESTED" },
        { label: "DNP", value: "DNP" },
        { label: "FOLLOW UP", value: "FOLLOW UP" },
        { label: "SWITCH OFF", value: "SWITCH OFF" },
        { label: "CALL DISCONNECTED", value: "CALL DISCONNECTED" },
        { label: "OTHERS", value: "OTHERS" },
      ],
    },
    {
      label: "Looking for",
      name: "course",
      type: "select",
      options: [
        { label: "BACHELORS", value: "BACHELORS" },
        { label: "MASTERS", value: "MASTERS" },
        { label: "MBA", value: "MBA" },
        { label: "MBBS", value: "MBBS" },
        { label: "MEDICAL", value: "MEDICAL" },
        { label: "SPOKEN ENGLISH", value: "SPOKEN ENGLISH" },
        { label: "IELTS COURSE", value: "IELTS COURSE" },
        { label: "TESTAS COURSE", value: "TESTAS COURSE" },
        { label: "GERMAN LANGUAGE COURSE", value: "GERMAN LANGUAGE COURSE" },
        { label: "WORKING VISA", value: "WORKING VISA" },
        { label: "OTHERS", value: "OTHERS" },
      ],
    },
    {
      label: "Transfer to",
      name: "transferTo.id",
      type: "select",
      options: employees, // Ensure `employees` is an array
    },
  ];

  // Setup react-hook-form with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(contacts), // Use the Yup schema
  });

  useEffect(() => {
    const fetchContactData = async () => {
      if (id) {
        setLoading(true); // Set loading true when fetching contact data
        try {
          const response = await apiClient.get(`/api/database/student-database?id=${id}`);
          setInitialData(response.data);
          reset(response.data); // Reset form with initial data
        } catch (error) {
          console.error("Error fetching contact data:", error);
        } finally {
          setLoading(false); // Set loading to false after contact data is fetched
        }
      }
    };
    fetchContactData();
  }, [id, reset]);

  if(loading){
    return<Loader/>
  }
  // Form submit handler
  const handleFormSubmit = async (data: { [key: string]: any }) => {
    try {
      if (id) {
        delete data._id;
      }
  
      // Check if transferTo.id exists in the data
      if (data.transferTo?.id) {
        try {
          // Fetch employee details using transferTo.id
          const employeeResponse = await fetch(`/api/employees?status=ACTIVE&id=${data.transferTo.id}`);
          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            // Update transferTo.name with the employee's name
            data.transferTo.name = employeeData?.basicField?.name;
          } else {
            console.error("Error fetching employee details:", await employeeResponse.json());
            return; // Stop submission if fetching employee fails
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
          return; // Stop submission if there's an error
        }
      }
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
      const createdAt = new Date(now.getTime() + istOffset);
      data.transferAt= createdAt
      const payload = data;
      const method = "PUT";
      const url = `/api/database/student-database?id=${id}`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log("Form Data Submitted Successfully:", result);
        router.back();
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue mb-4 cursor-pointer"
        onClick={() => {
          router.back();
        }}
      >
        Back
      </button>

      {/* Form component (AddEdit) */}
      <AddEdit
        //@ts-ignore
        fields={contactFields}
        initialData={initialData}
        onSubmit={handleFormSubmit} // handleSubmit from react-hook-form
      />
    </div>
  );
};

const ContactAddPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactAddPageContent />
    </Suspense>
  );
};

export default ContactAddPage;
