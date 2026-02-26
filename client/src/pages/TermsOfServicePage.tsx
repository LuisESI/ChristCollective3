import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <div className="w-16 h-1 bg-primary mb-4"></div>
          <p className="text-gray-400">Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: February 25, 2026</p>
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Christ Collective platform ("Platform"), including our website and mobile application,
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access
              or use the Platform. These Terms constitute a legally binding agreement between you and Christ Collective.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use the Platform. By creating an account, you represent and warrant that
              you are at least 13 years old and that all information you provide is accurate and complete. If you are under 18,
              you represent that you have your parent or guardian's permission to use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="mb-4">
              To access most features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Verify your email address before accessing the Platform</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activity that occurs under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Community Standards and Acceptable Use</h2>
            <p className="mb-4">
              Christ Collective is a faith-based community platform. You agree not to post, share, or transmit any content that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Is hateful, discriminatory, harassing, or threatening toward any individual or group</li>
              <li>Is sexually explicit, obscene, or pornographic</li>
              <li>Promotes violence, self-harm, or illegal activity</li>
              <li>Infringes on the intellectual property rights of others</li>
              <li>Contains malware, spam, or deceptive content</li>
              <li>Impersonates another person or entity</li>
              <li>Violates any applicable local, state, national, or international law</li>
            </ul>
            <p>
              All content submitted to the Platform is subject to automated AI moderation and human review. Content that violates
              these standards may be removed and may result in account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Membership and Payments</h2>
            <h3 className="text-lg font-semibold text-primary mb-2">Membership Tiers</h3>
            <p className="mb-4">
              Christ Collective offers free and paid membership tiers. Paid memberships are billed on a monthly basis through Stripe.
              By subscribing to a paid plan, you authorize us to charge your payment method on a recurring monthly basis.
            </p>
            <h3 className="text-lg font-semibold text-primary mb-2">Cancellations and Refunds</h3>
            <p className="mb-4">
              You may cancel your membership at any time through your account settings. Cancellation takes effect at the end of the
              current billing period. We do not provide partial refunds for unused portions of a billing period except where required by law.
            </p>
            <h3 className="text-lg font-semibold text-primary mb-2">Donations</h3>
            <p>
              Donations made through the Platform are processed by Stripe. All donations are final and non-refundable unless a
              campaign is cancelled by its creator or in cases of verified fraud. Christ Collective does not guarantee the use
              of donated funds by campaign creators and is not responsible for how funds are applied after disbursement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Shop and E-Commerce</h2>
            <p>
              Products sold through the Christ Collective Shop are processed via Stripe. All sales are final unless a product
              arrives damaged or defective. For order issues, contact us within 14 days of delivery.
              We reserve the right to cancel any order at our discretion and issue a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Content Ownership and License</h2>
            <p className="mb-4">
              You retain ownership of the content you post on the Platform. By posting content, you grant Christ Collective
              a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your content
              solely for the purpose of operating and improving the Platform.
            </p>
            <p>
              Christ Collective retains all rights to the Platform's design, branding, software, and original content.
              You may not copy, modify, or distribute any part of the Platform without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Content Moderation</h2>
            <p>
              We use automated AI tools and human moderators to review content. Posts may be held for review, removed, or
              rejected without prior notice if they violate these Terms. You may report content that violates these Terms
              using the in-app reporting feature. We will review all reports and take appropriate action at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that
              we believe violates these Terms or is harmful to other users, the Platform, or us. You may delete your account
              at any time through your account settings. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either express
              or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.
              Your use of the Platform is at your sole risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Christ Collective shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection
              with your use of the Platform, even if we have been advised of the possibility of such damages.
              Our total liability to you shall not exceed the amount paid by you to Christ Collective in the 12 months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States.
              Any disputes arising under these Terms shall be resolved through binding arbitration or in the courts
              of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. When we make material changes, we will notify registered users via email
              and update the "Last Updated" date at the top of this page. Continued use of the Platform after changes
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <div className="mt-4 p-4 bg-[#0A0A0A] border border-primary/20 rounded-lg">
              <p className="text-white font-semibold">Christ Collective</p>
              <p className="text-primary">legal@christcollective.com</p>
              <p className="text-gray-400">christcollective.com</p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-gray-500 text-sm">© 2025 Christ Collective. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</Link>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
