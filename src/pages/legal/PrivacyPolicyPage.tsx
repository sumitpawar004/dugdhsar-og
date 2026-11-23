import React from 'react';
import { siteConfig } from '../../config/site';
import { hasRealValue, hasText } from '../../config/siteHelpers';
import { usePageSEO } from '../../lib/seo';

export const PrivacyPolicyPage: React.FC = () => {
  usePageSEO({
    title: `Privacy Policy — ${siteConfig.name}`,
    description: `Privacy Policy for ${siteConfig.name}. Learn how we use Google Sign-In (openid, email, profile), store data on Cloudflare D1/KV, process payments via Razorpay, and handle deletion requests.`,
    canonical: `${siteConfig.url}/privacy-policy`,
  });

  const showLegalName = hasText(siteConfig.legalName);
  const emailHref = hasRealValue(siteConfig.contact.email)
    ? `mailto:${siteConfig.contact.email}`
    : undefined;
  const grievanceEmailHref = hasRealValue(siteConfig.grievanceOfficer.email)
    ? `mailto:${siteConfig.grievanceOfficer.email}`
    : undefined;

  return (
    <article className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-6 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">
            Privacy &amp; Data Protection
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#302C26]/70 mb-8">
            Last Updated: {siteConfig.legal.lastUpdated} · Applies to {siteConfig.name} ({siteConfig.url})
          </p>

          <div className="space-y-7 text-sm text-[#302C26]/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                1. Who We Are
              </h2>
              <p>
                {siteConfig.name}
                {showLegalName ? ` (${siteConfig.legalName})` : ''} operates an A2 milk and dairy
                delivery subscription and one-time order service in{' '}
                {siteConfig.business.deliveryArea}. This Privacy Policy explains in plain language
                what personal information we collect when you use {siteConfig.url}, why we collect
                it, where it is stored, and how you can access, correct, or delete it.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                2. How We Use Google Sign-In
              </h2>
              <p>
                We offer Google Sign-In so you can sign in without creating a separate password.
                When you sign in with Google, we request only the basic OpenID Connect scopes:{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F3EDE1] text-xs font-mono">openid</code>,{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F3EDE1] text-xs font-mono">email</code>, and{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F3EDE1] text-xs font-mono">profile</code>.
              </p>
              <p>
                Using these scopes, we read <strong>only</strong> your name, verified email address,
                Google account identifier, and profile picture URL. We do <strong>not</strong>{' '}
                request, read, modify, or access anything else from your Google account (such as
                your Gmail messages, Google Drive files, Calendar, or Contacts).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                3. Information We Store and Where It Is Stored
              </h2>
              <p>To run your account and deliver your orders, we store the following information:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Account profile:</strong> your name, email address, profile picture URL,
                  and phone number (when you provide it).
                </li>
                <li>
                  <strong>Delivery addresses:</strong> recipient name, phone number, street address,
                  landmark, pincode, and optional location coordinates (latitude and longitude) used
                  to locate your doorstep for delivery.
                </li>
                <li>
                  <strong>Subscriptions and delivery preferences:</strong> selected dairy products,
                  quantities, delivery frequency, time slot, and pause/skip dates.
                </li>
                <li>
                  <strong>Order and payment history:</strong> items ordered, amounts in INR,
                  delivery status, invoices, and payment gateway reference IDs.
                </li>
                <li>
                  <strong>Customer enquiries and product reviews:</strong> messages or reviews you
                  voluntarily submit through our website.
                </li>
              </ul>
              <p>
                <strong>Where data is stored:</strong> Your account, address, subscription, order,
                and payment records are stored in <strong>Cloudflare D1</strong> (our primary
                database), and short-lived cache entries (such as public catalog data) are stored in{' '}
                <strong>Cloudflare KV</strong>, both hosted on Cloudflare&apos;s infrastructure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                4. Payment Processing (Razorpay)
              </h2>
              <p>
                Online payments (UPI, cards, net banking) are processed by{' '}
                <strong>Razorpay</strong>. When you pay online, your payment credentials are
                handled directly by Razorpay in accordance with Razorpay&apos;s privacy policy and
                security controls. {siteConfig.name} does not collect or store your full card
                numbers, CVV, bank passwords, or UPI PINs; we store only Razorpay order/payment IDs,
                payment status, and transaction amounts needed to confirm orders and issue refunds.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                5. No Sale of Personal Data &amp; Limited Sharing
              </h2>
              <p>
                We do <strong>not</strong> sell, rent, or trade your personal information to any
                third party. We share personal information only where necessary to operate the
                service:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Local delivery personnel / assigned dealers:</strong> your name, delivery
                  address, location coordinates, and contact phone number strictly to complete your
                  deliveries in {siteConfig.business.deliveryArea}.
                </li>
                <li>
                  <strong>Infrastructure and payment providers:</strong> Cloudflare (hosting, D1
                  database, KV cache), Google (Sign-In authentication), and Razorpay (online payment
                  processing).
                </li>
                <li>
                  <strong>Legal requirements:</strong> where disclosure is required by applicable
                  law, court order, or lawful government request.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                6. Cookies and Analytics
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Essential session cookies:</strong> We use HttpOnly session cookies (
                  <code className="px-1 py-0.5 rounded bg-[#F3EDE1] text-xs font-mono">dugdhsar_access</code>{' '}
                  and{' '}
                  <code className="px-1 py-0.5 rounded bg-[#F3EDE1] text-xs font-mono">dugdhsar_refresh</code>
                  ) to keep you signed in and to honor logouts.
                </li>
                <li>
                  <strong>Preference storage:</strong> We store your cookie consent choice and
                  temporary shopping cart items in your browser so your basket is preserved during
                  checkout.
                </li>
                <li>
                  <strong>Performance analytics:</strong> We may collect basic, non-personalized
                  website performance metrics (Core Web Vitals such as page load speed and layout
                  stability) to monitor site reliability. We do not run third-party advertising
                  trackers or cross-site ad profiling.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                7. Data Retention Periods
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Account profile, addresses, and subscriptions:</strong> retained while
                  your account is active, or until you request deletion.
                </li>
                <li>
                  <strong>Revoked session tokens and request idempotency keys:</strong> retained
                  only until they expire and removed automatically by scheduled cleanup.
                </li>
                <li>
                  <strong>Order, invoice, and payment transaction records:</strong> retained for the
                  duration required under applicable Indian tax, GST, and accounting laws (typically
                  up to 8 years from the end of the relevant financial year).
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                8. Your Rights: Access, Correction, and Deletion
              </h2>
              <p>
                You may request access to the personal data we hold about you, ask us to correct
                inaccurate details, or request deletion of your account and personal data at any
                time by emailing{' '}
                {emailHref ? (
                  <a href={emailHref} className="text-[#A34F37] font-semibold underline">
                    {siteConfig.contact.email}
                  </a>
                ) : (
                  <strong className="text-[#263D30]">{siteConfig.contact.email}</strong>
                )}{' '}
                from your registered email address. Signed-in users can also update their name,
                phone number, and saved addresses directly from their account settings.
              </p>
              <p>
                <strong>Effect of a deletion request:</strong> When we process a deletion request,
                we remove or anonymize your personal data (name, email address, phone number,
                profile picture, and saved delivery addresses) and cancel any active subscriptions.
                Transaction, order, invoice, and payment records required by law for tax,
                accounting, dispute resolution, or regulatory compliance are retained in
                non-personal form for the statutory retention period.
              </p>
            </section>

            <section className="space-y-2 p-5 rounded-xl bg-[#F8F4EC] border border-[#D8C9AD]">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                9. Grievance Officer (India IT Rules &amp; DPDP Act)
              </h2>
              <p>
                In accordance with the Information Technology (Intermediary Guidelines and Digital
                Media Ethics Code) Rules and the Digital Personal Data Protection Act, 2023, you may
                contact our Grievance Officer for any privacy questions, complaints, or data
                requests:
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs sm:text-sm">
                {hasText(siteConfig.grievanceOfficer.name) && (
                  <div>
                    <dt className="font-semibold text-[#263D30]">Name:</dt>
                    <dd>{siteConfig.grievanceOfficer.name}</dd>
                  </div>
                )}
                {hasText(siteConfig.grievanceOfficer.email) && (
                  <div>
                    <dt className="font-semibold text-[#263D30]">Email:</dt>
                    <dd>
                      {grievanceEmailHref ? (
                        <a href={grievanceEmailHref} className="text-[#A34F37] underline">
                          {siteConfig.grievanceOfficer.email}
                        </a>
                      ) : (
                        siteConfig.grievanceOfficer.email
                      )}
                    </dd>
                  </div>
                )}
                {hasText(siteConfig.grievanceOfficer.phone) && (
                  <div>
                    <dt className="font-semibold text-[#263D30]">Phone:</dt>
                    <dd>{siteConfig.grievanceOfficer.phone}</dd>
                  </div>
                )}
                {hasText(siteConfig.grievanceOfficer.address) && (
                  <div>
                    <dt className="font-semibold text-[#263D30]">Address:</dt>
                    <dd>{siteConfig.grievanceOfficer.address}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#D8C9AD]/60 text-xs text-[#302C26]/75">
              <p>
                Related policies:{' '}
                <a href="/terms-and-conditions" className="text-[#A34F37] underline font-medium">
                  Terms &amp; Conditions
                </a>{' '}
                ·{' '}
                <a href="/cancellation-refund" className="text-[#A34F37] underline font-medium">
                  Cancellation &amp; Refund Policy
                </a>{' '}
                ·{' '}
                <a href="/shipping-policy" className="text-[#A34F37] underline font-medium">
                  Shipping Policy
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
};
