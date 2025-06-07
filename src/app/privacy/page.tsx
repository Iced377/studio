
import React from 'react';
import Link from 'next/link';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Notice</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
        <p>
          Welcome to GutCheck! We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy notice explains how we collect, use, share, and protect your personal information when you use our application.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Collection</h2>
        <p>
          We collect various types of information in connection with the services we provide, including:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Information you provide directly (e.g., when you create an account, log meals, report symptoms).</li>
          <li>Data collected automatically (e.g., usage data, device information, IP address).</li>
          <li>Information from third-party sources (e.g., if you log in via a third-party service).</li>
        </ul>
        <p className="mt-2">
          Specifically, this may include health-related information, dietary habits, and other sensitive data that you choose to share with us to enable personalized insights and recommendations.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Usage</h2>
        <p>
          Your data is used to:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Provide, maintain, and improve our services.</li>
          <li>Personalize your experience and offer tailored recommendations.</li>
          <li>Communicate with you about your account or our services.</li>
          <li>Conduct research and analysis to better understand our users and improve our application.</li>
          <li>Ensure the security of our platform.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share your information in the following circumstances:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>With your consent.</li>
          <li>With service providers who assist us in our operations (e.g., cloud hosting, analytics). These providers are bound by confidentiality obligations.</li>
          <li>For legal reasons (e.g., to comply with a subpoena or other legal process).</li>
          <li>In connection with a sale, merger, or acquisition of all or part of our company.</li>
          <li>Aggregated or anonymized data may be shared for research or statistical purposes.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Security</h2>
        <p>
          We implement robust security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. These include encryption, access controls, and regular security assessments. However, no system is completely secure, and we cannot guarantee the absolute security of your information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">User Rights</h2>
        <p>
          You have certain rights regarding your personal data, including:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>The right to access your data.</li>
          <li>The right to correct inaccuracies in your data.</li>
          <li>The right to request deletion of your data.</li>
          <li>The right to object to or restrict certain processing activities.</li>
          <li>The right to data portability.</li>
        </ul>
        <p className="mt-2">
          You can exercise these rights by contacting us through the support channels provided in the app.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and for advertising purposes. You can manage your cookie preferences through your browser settings.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Changes to This Privacy Notice</h2>
        <p>
          We may update this privacy notice from time to time. We will notify you of any significant changes by posting the new notice on this page and, where appropriate, through other channels.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
        <p>
          If you have any questions or concerns about this privacy notice or our data practices, please contact us at <Link href="mailto:privacy@gutcheck.ai" className="text-blue-600 hover:underline">privacy@gutcheck.ai</Link>.
        </p>
      </section>

      <div className="mt-8 text-sm text-gray-500">
        <p>Last updated: July 31, 2024</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
