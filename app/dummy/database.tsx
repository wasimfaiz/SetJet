export const columns = [
    { header: "Name", accessor: "name", type: "text" },
    { header: "Created At", accessor: "createdAt", type: "dateTime" },
  ];

export const contactFields = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Email",
      value: "email",
    },
    {
      label: "Mobile",
      value: "phoneNumber",
    },
    {
      label: "State",
      value: "state",
    },
    {
      label: "Called At",
      value: "calledAt",
    },
    {
      label: "Status Updated At",
      value: "statusUpdatedAt",
    },
    {
      label: "Status",
      value: "status",
    },
    {
      label: "Looking for",
      value: "course",
    },
    {
      label: "Remark",
      value: "remark",
    },
    { label: "Transfer to", value: "transferTo.name"},
    { label: "Transfer from", value: "transferFrom.name"},
    { label: "Transfer at", value: "transferAt"},
  
  ];
export const statusTabs = [
    {
      label: "Total Interested",
      countKey: "interested",
      status: "INTERESTED",
      bgColor: "bg-green-400",
      hoverColor: "hover:bg-green-900",
    },
    {
      label: "Total Follow Up",
      countKey: "followUp",
      status: "FOLLOW UP",
      bgColor: "bg-red-400",
      hoverColor: "hover:bg-red-500",
    },
    {
      label: "Total Transferred",
      countKey: "transfer",
      status: "TRANSFER",
      bgColor: "bg-purple-400",
      hoverColor: "hover:bg-purple-500",
    },
  ];
export const studentFields = [
  { header: "Name", accessor: "name", type: "text" },
  { header: "Mobile", accessor: "phoneNumber", type: "text" },
  { header: "Status", accessor: "status", type: "text" },
  { header: "Employee", accessor: "employee.name", type: "text" },
  { header: "Transferred to", accessor: "transferTo.name", type: "text" },
  { header: "Transferred From", accessor: "transferFrom.name", type: "text" },
];