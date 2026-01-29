"use client";
import View from "@/app/components/view";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/app/contexts/permissionContext";
import { checkButtonVisibility } from "@/app/utils/helperFunc";
import Loader from "@/app/components/loader";
import apiClient from "@/app/utils/apiClient";
const employeeFields = [
  {
    label: "Name",
    value: "basicField.name",
    type: "text",
  },
  {
    label: "Employee Id",
    value: "basicField.empId",
    type: "text",
  },
  {
    label: "Email",
    value: "basicField.email",
    type: "text",
  },
  {
    label: "Password",
    value: "basicField.password",
    type: "text",
  },
  {
    label: "Mobile",
    value: "basicField.phoneNumber",
    type: "text",
  },
  {
    label: " Parant's Contact Number",
    value: "basicField.parantNumber",
    type: "text",
   
  },
  {
    label: " Emergency Contact Number",
    value: "basicField.emengencyNumber",
    type:"text",
  },
  {
    label: "D.O.B.",
    value: "basicField.dob",
    type: "dateTime"
  },
  {
    label: "Personal email id",
    value: "basicField.personalEmail",
    type: "text",
  },
  {
    label: "Designation",
    value: "basicField.jobRole",
    type: "text",
  },
  {
    label: "Department",
    value: "basicField.department",
    type: "text",
  },
  {
    label: "Job Location",
    value: "basicField.jobLocation",
    type: "text",
  },
  {
    label: "CTC",
    value: "basicField.ctc",
    type: "text",
  },
  {
    label: "PAN Card Number",
    value: "basicField.pan",
    type: "text",
  },
  {
    label: "Aadhar Card Number",
    value: "basicField.aadhar",
    type: "text",
  },
  {
    label: "Address",
    value: "basicField.address",
    type: "textarea",
  },
  {
    label: "Gender",
    value: "basicField.gender",
    type: "text",
  },
  {
    label: "status",
    value: "basicField.status",
    type: "text",
  },
  {
    label: "Joining Date",
    value: "basicField.doj",
    type: "text",
  },
  {
    label: "Last Working Date (if application)",
    value: "basicField.lwd",
    type: "text",
  },
  {
    label: "Role",
    value: "basicField.role",
    type: "text",
  },
  {
    label: "Profile picture ",
    value: "basicField.profilePic",
    type: "file",
  },
  {
    label: "Bank Account name",
    value: "bankField.bankName",
    type: "text",
  },
  {
    label: "Bank Account number",
    value: "bankField.bankAccountNumber",
    type: "text",
  },
  {
    label: "IFSC code",
    value: "bankField.ifscCode",
    type: "text",
  },
    {
      label: "Basic Salary",
      value: "earning.basicSalary",
      type: "number",
    },
    {
      label: "HRA (House Rent Allowance)",
      value: "earning.hra",
      type: "number",
    },
    {
      label: "Telephone Reimbursement",
      value: "earning.telephoneReimbursement",
      type: "number",
    },
    {
      label: "Bonus",
      value: "earning.bonus",
      type: "number",
    },
    {
      label: "LTA (Leave Travel Allowance)",
      value: "earning.lta",
      type: "number",
    },
    {
      label: "Special Allowance / Petrol Allowance",
      value: "earning.specialAllowancePetrolAllowance",
      type: "number",
    },
    {
      label: "Incentive",
      value: "earning.incentive",
      type: "number",
    },
    {
      label: "Income Tax",
      value: "tax.incomeTax",
      type: "number",
      required: true,
    },
    {
      label: "Provident Fund",
      value: "tax.providentFund",
      type: "number",
    },
    {
      label: "Professional Tax",
      value: "tax.professionalTax",
      type: "number",
    },
  {
    label: "Bank Passbook",
    value: "bankField.passbook",
    type: "file",
  },
  {
    label: "Aadhar Document ",
    value: "docField.adharDocument",
    type: "file",
  },
  {
    label: "PAN Document ",
    value: "docField.panDocument",
    type: "file",
  },
  {
    label: "10th Marksheet ",
    value: "docField.tenthMarksheet",
    type: "file",
  },
  {
    label: "12th Marksheet ",
    value: "docField.twelvethMarksheet",
    type: "file",
  },
  {
    label: "UG Marksheet ",
    value: "docField.ugMarksheet",
    type: "file",
  },
  {
    label: "PG Marksheet ",
    value: "docField.pgMarksheet",
    type: "file",
  },
  {
    label: "Last Company salary slip ",
    value: "docField.salarySlip",
    type: "file",
  },
  {
    label: "Last Company Experience letter ",
    value: "docField.expLetter",
    type: "file",
  },
  {
    label: "Last Company Offer letter ",
    value: "docField.offerLetter",
    type: "file",
  },
  {
    label: "Last Company Internship Cert (if applicable) ",
    value: "docField.offerLetter",
    type: "file",
  },
  {
    label: "Resume ",
    value: "docField.resume",
    type: "file",
  },
  {
    label: "Other docs ",
    value: "docField.otherDoc",
    type: "file",
  },
/*   {
    label: "Europass Email address",
    value: "companyField.email",
    type: "text",
  }, */
  {
    label: "Europass Contract",
    value: "companyField.contract",
    type: "file",
  },
  {
    label: "Europass Offer letter",
    value: "companyField.offerLetter",
    type: "file",
  },
  {
    label: "Europass ID",
    value: "companyField.idCard",
    type: "file",
  },
  {
    label: "Europass Relieving letter",
    value: "companyField.relievingLetter",
    type: "file",
  },
  {
    label: "Europass Experience letter",
    value: "companyField.expLetter",
    type: "file",
  },
  {
    label: "Europass Salary slip",
    value: "companyField.salarySlip",
    type: "file",
  },
];

const EmployeeViewPage = () => {
  const params = useParams();
  const { id } = params;
  const { permissions } = usePermissions();

  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEmployee = async (id: any) => {
    try {
      const response = await apiClient.get(`/api/employees?id=${id}`);
      setSelectedItem(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee(id);
    }
  }, [id]);

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    router.push(`/hrSystem/employee/add?id=${item._id}`);
  };

  if (loading) {
    return <Loader />;
  }
  console.log(selectedItem?.name);

  return (
    <div className="container">
      <button
        className="text-blue-500 underline hover:text-deepblue cursor-pointer"
        onClick={() => router.back()}
      >
        Back
      </button>
      <div className="flex items-center lg:gap-5 gap-1 pt-5 bg-gradient-to-r from-blue-900 to-deepblue text-white px-5 rounded-lg pb-4">
        <img
          src={selectedItem?.basicField?.profilePic || "/profilepic.png"}
          alt={selectedItem?.basicField?.name}
          className="lg:w-32 lg:h-32 w-14 h-14 rounded-full"
        />

        <div className="">
          <h2 className="lg:text-2xl text-white font-semibold mb-2">
            {selectedItem?.basicField?.name}
          </h2>
          <p className="text-gray-300 lg:text-lg text-[10px]">
            {selectedItem?.basicField?.role}
          </p>
        </div>
      </div>
      {selectedItem ? (
        <>
          <View
            item={selectedItem}
            // @ts-ignore
            fields={employeeFields}
            handleEdit={
              checkButtonVisibility(permissions, "employee", "edit")
                ? handleEdit
                : undefined
            }
          />
          <div className="overflow-x-auto my-5 bg-white flex flex-col justify-center py-5 shadow-lg rounded-lg">
            <strong className="text-lg m-5">Permissions :</strong>
            {selectedItem?.permissions !== "all" ?<table className="table-auto border-collapse border border-gray-300 w-4/5 text-left mx-5">
              <thead>
                <tr className="bg-gradient-to-r from-green-900 to-parrotgreen text-white">
                  <th className="border border-gray-300 px-2 py-2">Tab</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">
                    View
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center">
                    Add
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center">
                    Edit
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedItem?.permissions &&
                  Object.entries(selectedItem.permissions).map(
                    ([tab, actions]) => (
                      <tr key={tab}>
                        <td className="border border-gray-300 px-2 py-2 capitalize">
                          {tab === "database" ? "Database Management" : tab}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {/* @ts-ignore */}
                          {actions.includes("view") ? "✔️" : "❌"}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {/* @ts-ignore */}
                          {actions.includes("add") ? "✔️" : "❌"}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {/* @ts-ignore */}
                          {actions.includes("edit") ? "✔️" : "❌"}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {/* @ts-ignore */}
                          {actions.includes("delete") ? "✔️" : "❌"}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>:<div className="mx-10">All </div>}
          </div>
        </>
      ) : (
        <p>No employee found</p>
      )}
    </div>
  );
};
export default EmployeeViewPage;
