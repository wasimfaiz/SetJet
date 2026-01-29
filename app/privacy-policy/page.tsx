import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="max-w-3xl mx-auto p-6 prose prose-indigo">
      <h1>Privacy Policy</h1>
      <p>Last updated: May 2025</p>

      <p>
        Europass CRM (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is
        committed to protecting your privacy. This Privacy Policy explains how
        we collect, use, and safeguard your personal data when you use our
        internal CRM application integrated with WhatsApp Business API.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We may collect and process personal information including names, phone
        numbers, email addresses, and other information necessary for CRM and
        messaging purposes.
      </p>

      <h2>How We Use Your Data</h2>
      <p>
        Data is used solely to provide CRM services, send WhatsApp messages via
        the WhatsApp Business API, and improve our internal tools. We do not
        share your data with unauthorized third parties.
      </p>

      <h2>Data Security</h2>
      <p>
        We implement reasonable security measures to protect your data from
        unauthorized access.
      </p>

      <h2>Your Rights</h2>
      <p>
        You have the right to request access to your personal data and ask for
        corrections or deletion. See our{" "}
        <a href="/data-deletion" className="text-indigo-600 underline">
          Data Deletion Policy
        </a>{" "}
        for details.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at{" "}
        <a href="mailto:info@europass.in" className="text-indigo-600 underline">
          support@europass.in
        </a>
        .
      </p>
    </main>
  );
};

export default PrivacyPolicy;
