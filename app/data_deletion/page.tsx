import React from "react";

const DataDeletion: React.FC = () => {
  return (
    <main className="max-w-3xl mx-auto p-6 prose prose-indigo">
      <h1>User Data Deletion Instructions</h1>
      <p>Last updated: May 2025</p>

      <p>
        Europass CRM respects your right to delete your personal data. This
        document explains how you can request deletion of your data stored in
        our CRM system.
      </p>

      <h2>How to Request Data Deletion</h2>
      <p>
        To request deletion of your personal data, please contact our support
        team by sending an email to{" "}
        <a href="mailto:support@yastudy.com" className="text-indigo-600 underline">
          support@europass.in
        </a>
        . Please include your full name, email, and phone number to help us
        identify your records.
      </p>

      <h2>What Happens Next?</h2>
      <p>
        Upon receiving your request, we will verify your identity and proceed
        to delete your personal data from our CRM and any associated systems.
        We will confirm the deletion once completed.
      </p>

      <h2>Note</h2>
      <p>
        This process may take up to 30 days. Certain data may be retained if
        required by law or for legitimate business purposes.
      </p>
    </main>
  );
};

export default DataDeletion;
