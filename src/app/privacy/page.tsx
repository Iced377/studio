
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Import Button
import { Home } from 'lucide-react'; // Import Home icon

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Notice</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
        <p>
          Welcome to GutCheck! We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy notice explains how we collect, use, share, and protect your personal information when you use our application. Please note that this is a test project that is not currently intended for commercial use.
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
          We implement robust security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. These measures include, but are not limited to:
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>
            <strong>Authentication and Access Control:</strong> We utilize Google's robust authentication system for secure user management. Access to data is further controlled by Firestore Security Rules, ensuring users can only access their own information.
          </li>
          <li>
            <strong>Protection Against Automated Abuse:</strong> Google's latest reCAPTCHA v3 technology is employed to protect our application from spam, malicious bots, and other forms of automated abuse without requiring user interaction.
          </li>
          <li>
            <strong>Data Transmission Security:</strong> All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS (Secure Sockets Layer/Transport Layer Security) protocols to prevent eavesdropping and tampering.
          </li>
          <li>
            <strong>Backend Resource Protection:</strong> Firebase App Check is used to verify that requests to our backend services originate from authentic instances of our application, protecting against unauthorized access and abuse of backend resources.
          </li>
          <li>
            <strong>Network and DNS Security:</strong> We utilize premium Domain Name System (DNS) services that include enhanced security features such as Distributed Denial of Service (DDoS) protection and DNS Security Extensions (DNSSEC) to ensure reliable and secure resolution of our application's domain.
          </li>
          <li>
            <strong>Secure Cloud Infrastructure:</strong> Our application is hosted on Google Cloud Platform (GCP), which provides a secure and reliable infrastructure with comprehensive security controls and compliance certifications.
          </li>
          <li>
            <strong>Principle of Least Privilege:</strong> Our system architecture adheres to the principle of least privilege, meaning components and services are granted only the minimum access necessary to perform their functions, reducing potential impact from any compromised component.
          </li>
        </ul>
        <p className="mt-2">
          Despite these measures, no system is completely secure, and we cannot guarantee the absolute security of your information. We continuously strive to enhance our security practices.
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
          If you have any questions or concerns about this privacy notice or our data practices, please contact us via the green feedback button.
        </p>
      </section>

      <div className="mt-8 text-sm text-gray-500">
        <p>Last updated: June 7, 2025</p>
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link href="/?openDashboard=true">
            <Home className="mr-2 h-4 w-4" /> Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default PrivacyPage;
