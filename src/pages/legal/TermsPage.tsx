import React from 'react';
import { siteConfig } from '../../config/site';
import { DELIVERY_CUTOFFS } from '../../config/deliveryCutoffs';
import {
  getFssaiRegNo,
  getGstin,
  hasGstin,
  hasRealValue,
  hasText,
} from '../../config/siteHelpers';
import { usePageSEO } from '../../lib/seo';

export const TermsPage: React.FC = () => {
  usePageSEO({
    title: `Terms & Conditions — ${siteConfig.name}`,
    description: `Terms and Conditions for using ${siteConfig.name} A2 milk and dairy delivery subscriptions and one-time orders in ${siteConfig.business.deliveryArea}.`,
    canonical: `${siteConfig.url}/terms-and-conditions`,
  });

  const showLegalName = hasText(siteConfig.legalName);
  const showAddress = hasText(siteConfig.location.fullAddress);
  const showPhone = hasText(siteConfig.contact.phoneFormatted);
  const showEmail = hasText(siteConfig.contact.email);
  const emailHref = hasRealValue(siteConfig.contact.email)
    ? `mailto:${siteConfig.contact.email}`
    : undefined;
  const fssaiRegNo = getFssaiRegNo();
  const showGstin = hasGstin();
  const gstinValue = getGstin();

  return (
    <article className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-6 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">
            Service Terms
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-[#302C26]/70 mb-8">
            Last Updated: {siteConfig.legal.lastUpdated} · {siteConfig.name}
            {showLegalName ? ` (${siteConfig.legalName})` : ''}
          </p>

          <div className="space-y-7 text-sm text-[#302C26]/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms &amp; Conditions govern your access to {siteConfig.url} and your
                purchase of A2 milk and dairy products (through one-time orders or recurring
                delivery subscriptions) from {siteConfig.name}
                {showLegalName ? ` (${siteConfig.legalName})` : ''} in{' '}
                {siteConfig.business.deliveryArea}. By placing an order or starting a subscription,
                you agree to these terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                2. Account &amp; Accurate Delivery Details
              </h2>
              <p>
                Customer accounts use Google Sign-In. You are responsible for keeping your contact
                phone number, delivery address, pincode, and doorstep instructions accurate so our
                delivery team can reach you reliably.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                3. Orders, Subscriptions &amp; Daily Cut-Off
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Pricing:</strong> All product prices and delivery charges are displayed in
                  Indian Rupees (INR) before checkout confirmation.
                </li>
                <li>
                  <strong>Subscriptions:</strong> You may subscribe for recurring deliveries (such
                  as daily, alternate days, weekdays, or weekly) and pause, skip, or cancel upcoming
                  deliveries from your account.
                </li>
                <li>
                  <strong>Order &amp; skip cut-off times:</strong> Changes, pauses, skips, or
                  cancellations must be submitted before{' '}
                  <strong>{DELIVERY_CUTOFFS.morning.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.morning.cutoffIst24h} IST) for
                  morning deliveries ({DELIVERY_CUTOFFS.morning.windowLabel}), and before{' '}
                  <strong>{DELIVERY_CUTOFFS.evening.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.evening.cutoffIst24h} IST) for
                  evening deliveries ({DELIVERY_CUTOFFS.evening.windowLabel}). Requests submitted
                  after the cut-off apply from the following delivery cycle.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                4. Payments
              </h2>
              <p>
                We accept online payments processed through <strong>Razorpay</strong> (UPI, cards,
                net banking) as well as Cash on Delivery (COD) and UPI on delivery where available.
                Orders paid online are confirmed once payment is verified by Razorpay.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                5. Perishable Product Handling &amp; Reusable Bottles
              </h2>
              <p>
                Fresh milk and dairy items are perishable food products. Please collect your
                delivery promptly after drop-off and refrigerate immediately. Where products are
                delivered in reusable glass bottles, please rinse empty bottles and leave them out
                for collection during your next scheduled delivery.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                6. Cancellations, Refunds &amp; Delivery Policy
              </h2>
              <p>
                Order cancellations, subscription pauses, and refunds are governed by our{' '}
                <a href="/cancellation-refund" className="text-[#A34F37] underline font-medium">
                  Cancellation &amp; Refund Policy
                </a>
                . Service areas, delivery timings, and shipping charges are described in our{' '}
                <a href="/shipping-policy" className="text-[#A34F37] underline font-medium">
                  Shipping Policy
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                7. Service Availability &amp; Governing Law
              </h2>
              <p>
                We aim to deliver consistently during scheduled windows, but deliveries may
                occasionally be delayed or rescheduled due to severe weather, road disruptions, or
                other events outside our reasonable control. These terms are governed by the laws
                of India, and disputes are subject to the courts having jurisdiction in{' '}
                {siteConfig.legal.jurisdiction}.
              </p>
            </section>

            <section className="space-y-2 p-5 rounded-xl bg-[#F8F4EC] border border-[#D8C9AD]">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                8. Business &amp; Contact Information
              </h2>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li>
                  <strong>Business Name:</strong> {siteConfig.name}
                  {showLegalName ? ` (${siteConfig.legalName})` : ''}
                </li>
                {showAddress && (
                  <li>
                    <strong>Address:</strong> {siteConfig.location.fullAddress}
                  </li>
                )}
                {showPhone && (
                  <li>
                    <strong>Phone:</strong> {siteConfig.contact.phoneFormatted}
                  </li>
                )}
                {showEmail && (
                  <li>
                    <strong>Email:</strong>{' '}
                    {emailHref ? (
                      <a href={emailHref} className="text-[#A34F37] underline">
                        {siteConfig.contact.email}
                      </a>
                    ) : (
                      siteConfig.contact.email
                    )}
                  </li>
                )}
                {hasText(fssaiRegNo) && (
                  <li>
                    <strong>FSSAI Reg. No.:</strong> {fssaiRegNo}
                  </li>
                )}
                {showGstin && (
                  <li>
                    <strong>GSTIN:</strong> {gstinValue}
                  </li>
                )}
              </ul>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#D8C9AD]/60 text-xs text-[#302C26]/75">
              <p>
                Related policies:{' '}
                <a href="/privacy-policy" className="text-[#A34F37] underline font-medium">
                  Privacy Policy
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
