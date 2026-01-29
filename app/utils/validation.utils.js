import * as yup from "yup";
/* export const test = yup.object({
  name: yup.string().required("Please enter name"),
}); */

export const contacts = yup.object({
  name: yup
    .string()
    .required("Please enter name")
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field "),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  phoneNumber: yup
    .string()
    .matches(/^[0-9]+$/, "Only numbers are allowed for this field")
    .required("Please enter a mobile number"),
  action: yup.string().required("Please select an action"),
  course: yup.string().required("please select course"),
  date: yup
    .date()
    .required("Please select a date")
    .min(new Date(), "The date cannot be in the past"),
  startDate: yup
    .date()
    .required("Please select a start date")
    .max(new Date(), "Start date cannot be in the future"),
  endDate: yup
    .date()
    .required("Please select an end date")
    .min(yup.ref("startDate"), "End date cannot be earlier than start date"),
  time: yup
    .string()
    .oneOf(
      [
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "1:00 PM",
        "2:00 PM",
        "3:00 PM",
        "4:00 PM",
        "5:00 PM",
        "6:00 PM",
      ],
      "Please select a valid time slot"
    )
    .required("Please select a time slot"),
  address: yup.string().required("Address is required"),
  title: yup.string().required("Please enter the blog title"),
  picture: yup.string().required("Please upload a picture"),
  metaDesc: yup.string().required("Please provide a meta description for SEO"),
  category: yup
    .string()
    .oneOf(
      ["Test Prep & Visa", "Latest News", "Admission", "Loan & Scholarships"],
      "Please select a valid category"
    )
    .required("Please select a category"),
  desc: yup.string().required("Please provide a brief description or excerpt"),
  content: yup.string().required("Please provide the blog content"),
  author: yup.string().required("Please enter the author's name"),

  /*  profilePic: yup.mixed()
    .test("fileType", "Only PDF, JPG, or PNG files are allowed", (value) => {
      if (!value) return false;
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      return allowedTypes.includes(value.type);
    }).test("fileSize", "File size must be less than 1 MB", (value) => {
      return value && value.size <= 1048576; // 1 MB
    })
    .required("Profile picture is required") */

  studentReg: yup.object({
    studentName: yup
      .string()
      .required("Please enter name")
      .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field "),
    studentEmail: yup
      .string()
      .email("Please enter a valid email")
      .required("Email is required"),
    contact: yup
      .string()
      .matches(/^[0-9]+$/, "Only numbers are allowed for this field")
      .required("Please enter a mobile number"),
    regNo: yup.string().required("Registration number is required"),

    gender: yup
      .string()
      .oneOf(["MALE", "FEMALE"], "Please select a valid gender")
      .required("Gender is required"),
    district: yup.string().required("District is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    address: yup.string().required("Complete Address is required"),
    countryApplyingFor: yup
      .string()
      .required("Country Applying For is required"),
    courseApplyingFor: yup.string().required("Course Applying For is required"),
    stream: yup.string().oneOf(["UG", "PG"]).required("Stream is required"),
    rm: yup.string().required("Relationship Manager is required"),
    europassPackage: yup.string().required("Europass Package is required"),
    registration: yup.string().required("Registration is required"),
    firstInstallment: yup
      .string()
      .oneOf(["PAID", "NOT PAID"])
      .required("First Installment is required"),
    secondInstallment: yup
      .string()
      .oneOf(["PAID", "NOT PAID"])
      .required("Second Installment is required"),
    thirdInstallment: yup
      .string()
      .oneOf(["PAID", "NOT PAID"])
      .required("Third Installment is required"),
    balanceAmount: yup.string().required("Balance amount is required"),
    blockAccount: yup
      .string()
      .oneOf(["NOT REQUIRED", "OPEN", "PENDING"])
      .required("Block Account status is required"),
  }),

  academicField: yup.object({
    adhaar: yup.string().required("Adhaar Number is required"),
    pan: yup.string().required("PAN Number is required"),
    passport: yup.string().required("Passport Number is required"),
    tenthMarksheet: yup.mixed().required("10th Marksheet is required"),
    tenthAdmitCard: yup.mixed().required("10th Admit Card is required"),
    tenthMigration: yup.mixed().required("10th Migration is required"),
    tenthPassingCertificate: yup
      .mixed()
      .required("10th Passing Certificate is required"),
    tenthCharacterCertificate: yup
      .mixed()
      .required("10th Character Certificate is required"),
    tenthTransferCertificate: yup
      .mixed()
      .required("10th Transfer Certificate is required"),
    twelfthMarksheet: yup.mixed().required("12th Marksheet is required"),
    twelfthAdmitCard: yup.mixed().required("12th Admit Card is required"),
    twelfthMigration: yup.mixed().required("12th Migration is required"),
    twelfthPassingCertificate: yup
      .mixed()
      .required("12th Passing Certificate is required"),
    twelfthCharacterCertificate: yup
      .mixed()
      .required("12th Character Certificate is required"),
    twelfthTransferCertificate: yup
      .mixed()
      .required("12th Transfer Certificate is required"),
    passportSizePhoto: yup.mixed().required("Passport Size Photo is required"),
  }),

  docField: yup.object({
    lom: yup.mixed().required("LOM is required"),
    sop: yup.mixed().required("SOP is required"),
    testas: yup
      .string()
      .oneOf(["REQUIRED", "NOT REQUIRED"])
      .required("TestAS is required"),
    apsDocument: yup.mixed().required("APS Document is required"),
    studentAuthorisationLetter: yup
      .mixed()
      .required("Student Authorization Letter is required"),
    aps: yup.mixed().required("APS is required"),
    conditionalOfferLetter: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Conditional Offer Letter status is required"),
    offerLetter: yup.mixed().required("Offer Letter is required"),
    visaAppointmentDate: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Visa Appointment Date status is required"),
    visaInterviewPreparation: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Visa Interview Preparation status is required"),
    visaInterview: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Visa Interview status is required"),
    visaArrives: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Visa Arrives status is required"),
    accommodationTicket: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Accommodation Ticket status is required"),
    preDepartureCounselling: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Pre-Departure Counselling status is required"),
    airportPickup: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Airport Pickup status is required"),
    cityRegistration: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("City Registration status is required"),
    germanBankAccount: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("German Bank Account status is required"),
    agreementCancellation: yup
      .string()
      .oneOf(["PENDING", "DONE"])
      .required("Agreement Cancellation status is required"),
    releaseForm: yup
      .string()
      .oneOf(["YES", "NO"])
      .required("Release Form status is required"),
  }),

  basicField: yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: yup.string().required("Phone number is required"),
    jobRole: yup.string().required("Job role is required"),
    jobLocation: yup.string().required("Job location is required"),
    ctc: yup.string().required("CTC is required"),
    pan: yup.string().required("PAN is required"),
    aadhar: yup.string().required("Aadhar is required"),
    address: yup.string().required("Address is required"),
    gender: yup.string().required("Gender is required"),
    status: yup.string().required("Status is required"),
    doj: yup.date().required("Joining date is required"),
    lwd: yup.date().nullable(),
    username: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
    role: yup.string().required("Role is required"),
    permissions: yup
      .array()
      .of(yup.string())
      .required("Permissions are required"),
    profilePic: yup.mixed().required("Profile picture is required"),
  }),

  bankField: yup.object().shape({
    bankName: yup.string().required("Bank name is required"),
    bankAccountNumber: yup.string().required("Account number is required"),
    ifscCode: yup.string().required("IFSC code is required"),
  }),
  docField: yup.object().shape({
    adharDocument: yup.mixed().required("Aadhar document is required"),
    panDocument: yup.mixed().required("PAN document is required"),
    tenthMarksheet: yup.mixed().required("10th marksheet is required"),
    twelvethMarksheet: yup.mixed().required("12th marksheet is required"),
    ugMarksheet: yup.mixed().required("UG marksheet is required"),
    pgMarksheet: yup.mixed().required("PG marksheet is required"),
    salarySlip: yup.mixed().required("Salary slip is required"),
    expLetter: yup.mixed().required("Experience letter is required"),
    resume: yup.mixed().required("Resume is required"),
  }),
  companyField: yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    contract: yup.mixed().required("Company contract is required"),
    offerLetter: yup.mixed().required("Offer letter is required"),
    idCard: yup.mixed().required("ID card is required"),
    relievingLetter: yup.mixed().required("Relieving letter is required"),
    expLetter: yup.mixed().required("Experience letter is required"),
    salarySlip: yup.mixed().required("Salary slip is required"),
  }),

  studentId: yup.string().required("Student ID is required."),
  studentEur: yup.string().required("Student EUR is required."),
  /*  name: yup.string().required("Name is required."),
    date: yup.date().required("Date is required."), */
  applyFor: yup.string().required("Application details are required."),
  aadharNo: yup
    .string()
    .matches(/^\d{12}$/, "Aadhar number must be 12 digits.")
    .required("Aadhar number is required."),
  phoneNumber: yup
    .string()
    .matches(/^[6-9]\d{9}$/, "Enter a valid mobile number.")
    .required("Mobile number is required."),
  /*  email: yup.string()
      .email("Enter a valid email address.")
      .required("Email is required."), */
  gradMarksheet: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Graduation marksheet status is required."),
  gradPercent: yup
    .number()
    .typeError("Enter a valid percentage.")
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot exceed 100.")
    .required("Graduation percentage is required."),
  gradStream: yup.string().required("Graduation stream is required."),
  intergradMarksheet: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Intermediate marksheet status is required."),
  intergradPercent: yup
    .number()
    .typeError("Enter a valid percentage.")
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot exceed 100.")
    .required("Intermediate percentage is required."),
  intergradStream: yup.string().required("Intermediate stream is required."),
  matriMarksheet: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Matriculation marksheet status is required."),
  matriPercent: yup
    .number()
    .typeError("Enter a valid percentage.")
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot exceed 100.")
    .required("Matriculation percentage is required."),
  passport: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Passport status is required."),
  aadhar: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Aadhar card status is required."),
  birthCert: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Birth certificate status is required."),
  photos: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Photographs status is required."),
  letterOfRec: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Letter of recommendation status is required."),
  curVeuro: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Curriculum Vitae status is required."),
  regStatus: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Registration status is required."),
  appFeeStatus: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Application fee status is required."),
  installMentStatus1: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("1st installment status is required."),
  installMentStatus2: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("2nd installment status is required."),
  installMentStatus3: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("3rd installment status is required."),
  again: yup
    .string()
    .oneOf(["YES", "NO"], "Select YES or NO.")
    .required("Follow-up status is required."),
  remark: yup.string().required("Remark is required."),
  profilePic: yup
    .mixed()
    .required("Profile picture is required.")
    .test("fileSize", "File size must be less than 30KB.", (value) => {
      return value && value.size <= 30 * 1024;
    }),
  studentSig: yup.mixed().required("Student signature is required."),
  parentSig: yup.mixed().required("Parent's signature is required."),
});
