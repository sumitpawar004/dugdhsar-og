import React from 'react';
import { siteConfig } from '../../config/site';
import { DELIVERY_CUTOFFS } from '../../config/deliveryCutoffs';
import { hasRealValue, hasText } from '../../config/siteHelpers';
import { usePageSEO } from '../../lib/seo';
export { CancellationRefundPage } from './CancellationRefundPage';

export const ShippingPolicyPage: React.FC = () => {
  usePageSEO({
    title: `Shipping & Delivery Policy — ${siteConfig.name}`,
    description: `Local delivery coverage, morning and evening slots, cut-off times, and delivery fees for ${siteConfig.name} A2 milk and dairy orders in ${siteConfig.business.deliveryArea}.`,
    canonical: `${siteConfig.url}/shipping-policy`,
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
            Local Delivery Standards
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-[#302C26]/70 mb-8">
            Last Updated: {siteConfig.legal.lastUpdated} · {siteConfig.name}
            {showLegalName ? ` (${siteConfig.legalName})` : ''}
          </p>

          <div className="space-y-7 text-sm text-[#302C26]/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                1. Serviceable Delivery Area
              </h2>
              <p>
                {siteConfig.name} currently delivers fresh A2 milk and dairy products locally within
                serviceable pincodes of <strong>{siteConfig.business.deliveryArea}</strong>. You can
                check whether your pincode is covered before placing an order or starting a
                subscription at checkout.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                2. Delivery Time Slots &amp; Order Cut-Off
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Morning Delivery Window ({DELIVERY_CUTOFFS.morning.windowLabel}):</strong>{' '}
                  Orders, skips, and pauses must be submitted before{' '}
                  <strong>{DELIVERY_CUTOFFS.morning.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.morning.cutoffIst24h} IST).
                </li>
                <li>
                  <strong>Evening Delivery Window ({DELIVERY_CUTOFFS.evening.windowLabel}):</strong>{' '}
                  Orders, skips, and pauses must be submitted before{' '}
                  <strong>{DELIVERY_CUTOFFS.evening.cutoffLabel}</strong> ({DELIVERY_CUTOFFS.evening.cutoffIst24h} IST).
                </li>
                <li>
                  <strong>After Cut-Off:</strong> Requests placed after the slot cut-off are
                  automatically scheduled for the next eligible delivery cycle.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                3. Delivery Charges
              </h2>
              <p>
                Any applicable delivery charge or free-delivery threshold for your delivery zone is
                calculated and displayed clearly in your cart and checkout summary before you place
                an order.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                4. Doorstep Delivery &amp; Accuracy of Address
              </h2>
              <p>
                Please ensure your address, landmark, pincode, optional map coordinates, and mobile
                number are accurate and that our delivery partner can access your doorstep during
                the chosen delivery window. If a delivery cannot be completed due to an incorrect
                address or unreachable location, our team will try to contact you on your registered
                phone number.
              </p>
            </section>

            <section className="space-y-2 p-5 rounded-xl bg-[#F8F4EC] border border-[#D8C9AD]">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                5. Delivery Support
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
                <a href="/cancellation-refund" className="text-[#A34F37] underline font-medium">
                  Cancellation &amp; Refund Policy
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
};

export const ReturnPolicyPage: React.FC = () => {
  usePageSEO({
    title: `Return & Replacement Policy — ${siteConfig.name}`,
    description: `Return and replacement terms for perishable dairy deliveries from ${siteConfig.name} in ${siteConfig.business.deliveryArea}.`,
    canonical: `${siteConfig.url}/return-policy`,
  });

  const showPhone = hasText(siteConfig.contact.phoneFormatted);
  const showEmail = hasText(siteConfig.contact.email);

  return (
    <article className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-6 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">
            Perishable Food Safety
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Return &amp; Replacement Policy
          </h1>
          <p className="text-xs text-[#302C26]/70 mb-8">
            Last Updated: {siteConfig.legal.lastUpdated} · {siteConfig.name}
          </p>

          <div className="space-y-6 text-sm text-[#302C26]/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                1. Perishable Dairy Items
              </h2>
              <p>
                For food safety and hygiene reasons, fresh milk and perishable dairy products cannot
                be physically returned once delivered and accepted. If an item arrives damaged,
                leaking, spoiled, or incorrect, please report it on the same day
                {showEmail || showPhone ? (
                  <>
                    {' '}
                    to {showEmail && <strong>{siteConfig.contact.email}</strong>}
                    {showEmail && showPhone ? ' or ' : ''}
                    {showPhone && <strong>{siteConfig.contact.phoneFormatted}</strong>}
                  </>
                ) : null}{' '}
                for a replacement or refund.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-serif font-semibold text-[#263D30]">
                2. Sealed Non-Perishable Dairy Products
              </h2>
              <p>
                Unopened, tamper-sealed jars (such as ghee) that arrive damaged or incorrect may be
                reported within 48 hours of delivery for replacement or refund. See our full{' '}
                <a href="/cancellation-refund" className="text-[#A34F37] underline font-medium">
                  Cancellation &amp; Refund Policy
                </a>{' '}
                for refund timelines.
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
};
