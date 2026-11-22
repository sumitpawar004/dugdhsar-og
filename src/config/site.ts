/**
 * DUGDHSAR — Single Source of Truth for Business Details, Legal Policies, Footer & SEO
 *
 * Fill in the [PLACEHOLDER] values below once — they automatically update across:
 *   - Footer on every page
 *   - /privacy-policy (including Grievance Officer under India IT Rules & DPDP Act)
 *   - /terms-and-conditions
 *   - /cancellation-refund
 *   - /shipping-policy
 *   - Prerendered static HTML, canonical URLs, JSON-LD, and sitemap.xml
 */

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  themeColor: string;
  locale: string;
  language: string;
  foundingYear?: number;
  contact: {
    phone: string;
    phoneFormatted: string;
    whatsapp: string;
    email: string;
  };
  location: {
    street: string;
    colony: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    coordinatesDms?: string;
    plusCode: string;
    fullAddress: string;
    googleMapsUrl: string;
    googleMapsDirectionsUrl?: string;
    googleMapsEmbedUrl?: string;
  };
  business: {
    deliveryArea: string;
    morningHours: string;
    eveningHours: string;
    cutoffTime: string;
    openingHoursRaw: string;
    openingHoursSpecification: Array<{
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }>;
    areaServed: Array<{
      name: string;
      postalCode: string;
    }>;
    priceRange: string;
    fssaiLicense: string;
    gstin: string;
  };
  grievanceOfficer: {
    name: string;
    email: string;
    address: string;
    phone: string;
  };
  legal: {
    lastUpdated: string;
    jurisdiction: string;
  };
  social: {
    instagram: string;
    instagramHandle: string;
    youtube?: string;
  };
  verification: {
    googleSiteVerification?: string;
    bingSiteVerification?: string;
    indexNowKey?: string;
  };
  analytics: {
    cloudflareWebAnalyticsToken?: string;
  };
}

export const siteConfig: SiteConfig = {
  // === EDIT YOUR BUSINESS DETAILS HERE ===
  name: 'Dugdhsar',
  legalName: '[YOUR LEGAL BUSINESS NAME]',
  tagline: 'A2 Milk & Dairy Delivery Subscription in Seoni, Madhya Pradesh',
  description:
    'Dugdhsar provides A2 milk and dairy delivery subscriptions and one-time orders in Seoni, Madhya Pradesh.',
  url: 'https://dugdhsar.in',
  ogImage: 'https://dugdhsar.in/assets/vedic_gir_cow_meadow.jpg',
  themeColor: '#263D30',
  locale: 'en_IN',
  language: 'en-IN',

  contact: {
    phone: '[YOUR PHONE]',
    phoneFormatted: '[YOUR PHONE]',
    whatsapp: '[YOUR WHATSAPP NUMBER]',
    email: '[YOUR EMAIL]',
  },

  location: {
    street: '[YOUR STREET / LOCALITY]',
    colony: '[YOUR COLONY / AREA]',
    city: 'Seoni',
    state: 'Madhya Pradesh',
    stateCode: 'IN-MP',
    postalCode: '[YOUR PINCODE]',
    country: 'IN',
    latitude: 22.085917,
    longitude: 79.55775,
    coordinatesDms: '22°05\'09.3"N 79°33\'27.9"E',
    plusCode: '[YOUR PLUS CODE]',
    fullAddress: '[YOUR ADDRESS], Seoni, Madhya Pradesh [YOUR PINCODE]',
    googleMapsUrl: 'https://maps.google.com/?q=22.085917,79.55775',
    googleMapsDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=22.085917,79.55775',
    googleMapsEmbedUrl: 'https://maps.google.com/maps?q=22.085917,79.55775&hl=en&z=17&output=embed',
  },

  business: {
    deliveryArea: 'Seoni, Madhya Pradesh',
    morningHours: '5:00 AM – 10:00 AM IST',
    eveningHours: '6:00 PM – 10:00 PM IST',
    cutoffTime: '8:00 PM IST',
    openingHoursRaw: 'Mo-Su 05:00-10:00, 18:00-22:00',
    openingHoursSpecification: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '05:00',
        closes: '10:00',
      },
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '18:00',
        closes: '22:00',
      },
    ],
    areaServed: [
      { name: 'Seoni', postalCode: '480661' },
    ],
    priceRange: '₹₹',
    fssaiLicense: '[FSSAI NUMBER]',
    gstin: '[YOUR GSTIN]',
  },

  grievanceOfficer: {
    name: '[GRIEVANCE OFFICER NAME]',
    email: '[GRIEVANCE OFFICER EMAIL]',
    address: '[GRIEVANCE OFFICER ADDRESS]',
    phone: '[GRIEVANCE OFFICER PHONE]',
  },

  legal: {
    lastUpdated: 'April 2026',
    jurisdiction: 'Seoni, Madhya Pradesh, India',
  },

  social: {
    instagram: 'https://www.instagram.com/dugdhsar.in/',
    instagramHandle: '@dugdhsar.in',
  },

  verification: {
    googleSiteVerification: typeof process !== 'undefined' ? process.env?.GOOGLE_SITE_VERIFICATION || '' : '',
    bingSiteVerification: typeof process !== 'undefined' ? process.env?.BING_SITE_VERIFICATION || '' : '',
    indexNowKey: '',
  },

  analytics: {
    cloudflareWebAnalyticsToken: typeof process !== 'undefined' ? process.env?.CF_BEACON_TOKEN || '' : '',
  },
};

/**
 * Helper: returns a valid tel:/mailto: href only when the placeholder has been replaced.
 */
export function isPlaceholderValue(value: string): boolean {
  return value.trim().startsWith('[') && value.trim().endsWith(']');
}
