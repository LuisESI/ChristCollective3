import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <div className="w-16 h-1 bg-primary mb-4"></div>
          <p className="text-gray-400">Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: February 25, 2026</p>
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Christ Collective ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform, including our website and mobile application
              (collectively, the "Platform"). Please read this policy carefully. If you do not agree with the terms of this Privacy Policy,
              please do not access the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-primary mb-2">Personal Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-2">
              <li>Name, email address, and password when creating an account</li>
              <li>Profile information such as bio, profile photo, and cover photo</li>
              <li>Payment information processed securely through Stripe (we do not store raw card data)</li>
              <li>Business or ministry profile details if applicable</li>
              <li>Content you post, including text, images, and videos</li>
              <li>Communications you send through our messaging features</li>
            </ul>
            <h3 className="text-lg font-semibold text-primary mb-2">Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Device type, operating system, and browser type</li>
              <li>IP address and general location data</li>
              <li>Pages viewed, features used, and time spent on the Platform</li>
              <li>Session tokens for authentication purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To create and manage your account</li>
              <li>To process donations and payments securely via Stripe</li>
              <li>To display your profile and content to other community members</li>
              <li>To send transactional emails such as email verification and password resets</li>
              <li>To moderate content using automated AI tools and human review</li>
              <li>To improve the Platform and develop new features</li>
              <li>To comply with legal obligations</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Sharing Your Information</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Stripe</span> — for secure payment processing</li>
              <li><span className="text-white font-medium">Resend</span> — for transactional email delivery</li>
              <li><span className="text-white font-medium">OpenAI</span> — for automated content moderation (text and images are analyzed but not retained for training)</li>
              <li><span className="text-white font-medium">Google Cloud Storage (via Replit)</span> — for storing uploaded files</li>
              <li><span className="text-white font-medium">Law enforcement or regulatory authorities</span> — when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services.
              If you delete your account, we will remove your personal data within 30 days, except where retention is required
              by law or for legitimate business purposes such as fraud prevention.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of certain data processing activities</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-4">To exercise any of these rights, please contact us at <span className="text-primary">privacy@christcollective.com</span>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption, hashed passwords, session management,
              rate limiting, and input validation. Payment data is handled exclusively through Stripe's PCI-compliant infrastructure.
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
            <p>
              We use session cookies to keep you logged in and to maintain your preferences. We do not use third-party advertising
              cookies or tracking pixels. You can disable cookies in your browser settings, but this may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
            <p>
              The Platform is not intended for children under the age of 13. We do not knowingly collect personal information from
              children under 13. If you believe a child under 13 has provided us with personal information, please contact us
              immediately and we will take steps to remove that information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users by email when material changes
              are made. Continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <div className="mt-4 p-4 bg-[#0A0A0A] border border-primary/20 rounded-lg">
              <p className="text-white font-semibold">Christ Collective</p>
              <p className="text-primary">privacy@christcollective.com</p>
              <p className="text-gray-400">christcollective.com</p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-gray-500 text-sm">© 2025 Christ Collective. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</Link>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
