import React from 'react';
import { siteConfig } from '../../config/site';
import { DELIVERY_CUTOFFS } from '../../config/deliveryCutoffs';
import { hasRealValue, hasText } from '../../config/siteHelpers';
import { usePageSEO } from '../../lib/seo';

export const CancellationRefundPage: React.FC = () => {
  usePageSEO({
    title: `Cancellation & Refund Policy — ${siteConfig.name}`,
    description: `Cancellation, subscription pause/skip, and Razorpay refund policy for ${siteConfig.name} A2 milk and dairy deliveries in ${siteConfig.business.deliveryArea}.`,
    canonical: `${siteConfig.url}/cancellation-refund`,
  });

  const showLegalName = hasText(siteConfig.legalName);
  const showAddress = hasText(siteConfig.location.fullAddress);
  const showPhone = hasText(siteConfig.contact.phoneFormatted);
  const showEmail = hasText(siteConfig.contact.email);
  const emailHref = hasRealValue(siteConfig.contact.email)
    ? `mailto:${siteConfig.contact.email}`
    : undefined;

  return (
    <article className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-6 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">
            Orders &amp; Subscriptions
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-xs text-[#302C26]/70 mb-8">
            Last Updated: {siteConfig.legal.lastUpdated} · {siteConfig.name}
            {showLegalName ? ` (${siteConfig.legalName})` : ''}
          </p>

          <div className="space-y-7 text-sm text-[#302C26]/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                1. Subscription Pause, Skip &amp; Cancellation
              </h2>
              <p>
                You can skip a specific delivery date, pause your subscription temporarily, or
                cancel your subscription from your customer account at any time. To avoid dispatch,
                please submit your skip, pause, or cancellation before{' '}
                <strong>{DELIVERY_CUTOFFS.morning.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.morning.cutoffIst24h} IST) for
                morning deliveries, or before{' '}
                <strong>{DELIVERY_CUTOFFS.evening.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.evening.cutoffIst24h} IST) for
                evening deliveries. Requests made after the slot cut-off take effect from the next
                eligible delivery date.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                2. One-Time Order Cancellation
              </h2>
              <p>
                One-time orders can be cancelled before they are dispatched for delivery. Once a
                perishable dairy order is out for delivery or delivered, it cannot be cancelled
                except for damaged, spoiled, or incorrect items as described below.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                3. Damaged, Spoiled, or Missing Items
              </h2>
              <p>
                Because milk and fresh dairy products are perishable, we cannot accept physical
                returns of opened or accepted perishable items for food safety reasons. However, if
                your delivery arrives damaged, broken, spoiled, or with a missing or wrong item,
                please report the issue promptly on the same day with your order number (and a photo
                if applicable)
                {showEmail || showPhone ? (
                  <>
                    {' '}
                    by contacting us at{' '}
                    {showEmail && (
                      emailHref ? (
                        <a href={emailHref} className="text-[#A34F37] underline font-medium">
                          {siteConfig.contact.email}
                        </a>
                      ) : (
                        <strong className="text-[#263D30]">{siteConfig.contact.email}</strong>
                      )
                    )}
                    {showEmail && showPhone ? ' or ' : ''}
                    {showPhone && <strong>{siteConfig.contact.phoneFormatted}</strong>}
                  </>
                ) : null}
                . Verified claims are eligible for a replacement delivery or a refund for the
                affected item.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                4. Refund Processing &amp; Timelines
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Online payments (Razorpay):</strong> Approved refunds for orders or
                  prepaid subscription balances paid via Razorpay are initiated back to your
                  original payment method through Razorpay. Depending on your bank or UPI provider,
                  refunds typically reflect within 5 to 7 business days after initiation.
                </li>
                <li>
                  <strong>Cash on Delivery / UPI on Delivery:</strong> If an order is cancelled
                  before delivery, no amount is charged. For any verified refund on a paid delivery,
                  we coordinate refund settlement via UPI or bank transfer with you directly.
                </li>
              </ul>
            </section>

            <section className="space-y-2 p-5 rounded-xl bg-[#F8F4EC] border border-[#D8C9AD]">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                5. Contact for Cancellations &amp; Refunds
              </h2>
              <p className="text-xs sm:text-sm">
                <strong>{siteConfig.name}</strong>
                {showAddress ? ` · ${siteConfig.location.fullAddress}` : ''}
                {(showPhone || showEmail) && <br />}
                {showPhone && <>Phone: {siteConfig.contact.phoneFormatted}</>}
                {showPhone && showEmail ? ' · ' : ''}
                {showEmail && (
                  <>
                    Email:{' '}
                    {emailHref ? (
                      <a href={emailHref} className="text-[#A34F37] underline">
                        {siteConfig.contact.email}
                      </a>
                    ) : (
                      siteConfig.contact.email
                    )}
                  </>
                )}
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#D8C9AD]/60 text-xs text-[#302C26]/75">
              <p>
                Related policies:{' '}
                <a href="/privacy-policy" className="text-[#A34F37] underline font-medium">
                  Privacy Policy
                </a>{' '}
                ·{' '}
                <a href="/terms-and-conditions" className="text-[#A34F37] underline font-medium">
                  Terms &amp; Conditions
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
