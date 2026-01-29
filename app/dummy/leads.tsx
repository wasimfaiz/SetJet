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
  ];
  export const leadFields = [
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
  ];
  export const leadsFieldEdit =  [
    {
      label: "Name",
      name: "name",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Mobile",
      name: "phoneNumber",
      type: "phoneNumber",
      placeholder: "Mobile",
      required: true
    },
    {
      label: "Email",
      name: "email",
      type: "text",
      placeholder: "Email",
    },
    {
      label: "Date",
      name: "date",
      type: "date",
      placeholder: "Date",
    },
    {
      label: "10th Percentage",
      name: "tenthPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "12th Percentage",
      name: "twelfthPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "UG Percentage",
      name: "ugPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "PG Percentage",
      name: "pgPercent",
      type: "text",
      placeholder: "Percentage",
    },
    {
      label: "Apply for Course",
      name: "course",
      type: "text",
      placeholder: "Apply for",
    },
    {
      label: "Apply for Country",
      name: "country",
      type: "select",
      placeholder: "Country",
      options:[
        { value: "USA", label: "USA" },
        { value: "CANADA", label: "CANADA" },
        { value: "UK", label: "UK" },
        { value: "FINLAND", label: "FINLAND" },
        { value: "MALTA", label: "MALTA" },
        { value: "LUXEMBOURG", label: "LUXEMBOURG" },
        { value: "CHINA", label: "CHINA" },
        { value: "NEPAL", label: "NEPAL" },
        { value: "BANGLADESH", label: "BANGLADESH" },
        { value: "BHUTAN", label: "BHUTAN" },
        { value: "NEW ZEALAND", label: "NEW ZEALAND" },
        { value: "SINGAPORE", label: "SINGAPORE" },
        { value: "SWITZERLAND", label: "SWITZERLAND" },
        { value: "SWEDEN", label: "SWEDEN" },
        { value: "GERMANY", label: "GERMANY" },
        { value: "GEORGIA", label: "GEORGIA" },
        { value: "AUSTRIA", label: "AUSTRIA" },
        { value: "AUSTRALIA", label: "AUSTRALIA" },
        { value: "RUSSIA", label: "RUSSIA" },
        { value: "ITALY", label: "ITALY" },
        { value: "MAURITIUS", label: "MAURITIUS" }
      ],      
    },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
      ],
    },
    {
      label: "Counseller name",
      name: "counsellorName",
      type: "text",
      placeholder: "Name",
    },
    {
      label: "Address",
      name: "address",
      type: "textarea",
      placeholder: "Address",
    },
    {
      label: "Profile picture",
      name: "profilePic",
      type: "file",
    },
  ];