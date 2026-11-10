/**
 * DUGDHSAR — Vedic Gir Cow A2 Dairy
 * Single Source of Truth for Technical SEO, OpenGraph, JSON-LD, Business NAP & Edge Config
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
  foundingYear: number;
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
    stateCode: string; // IN-MP
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    plusCode: string;
    fullAddress: string;
    googleMapsUrl: string;
  };
  business: {
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
  name: 'DUGDHSAR',
  legalName: 'DUGDHSAR Vedic Dairy & Agriculture Farms',
  tagline: 'Pure Vedic Gir Cow A2 Milk & Bilona Ghee',
  description: 'Pure A2 Gir cow milk & traditional bilona ghee delivered in Seoni before 11 AM. 60 years Vedic heritage, zero plastic glass bottles, chilled at 2°C–4°C.',
  url: 'https://dugdhsar.in',
  ogImage: 'https://dugdhsar.in/assets/vedic_gir_cow_meadow.jpg',
  themeColor: '#263D30',
  locale: 'en_IN',
  language: 'en-IN',
  foundingYear: 1964,
  contact: {
    phone: '+917067672604',
    phoneFormatted: '+91 7067672604',
    whatsapp: '+917067672604',
    email: 'contact@dugdhsar.in',
  },
  location: {
    street: 'Barghat Rd, Sufi Nagar',
    colony: 'Sanjay Vihar Colony',
    city: 'Seoni',
    state: 'Madhya Pradesh',
    stateCode: 'IN-MP',
    postalCode: '480661',
    country: 'IN',
    latitude: 22.0869,
    longitude: 79.5435,
    plusCode: '3HP5+948 Seoni, Madhya Pradesh',
    fullAddress: '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661',
    googleMapsUrl: 'https://maps.google.com/?q=22.0869,79.5435',
  },
  business: {
    openingHoursRaw: 'Mo-Su 05:00-11:00, 17:00-22:00',
    openingHoursSpecification: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '05:00',
        closes: '11:00',
      },
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '17:00',
        closes: '22:00',
      },
    ],
    areaServed: [
      { name: 'Sanjay Vihar Colony', postalCode: '480661' },
      { name: 'Sufi Nagar', postalCode: '480661' },
      { name: 'Barghat Road', postalCode: '480661' },
      { name: 'Civil Lines', postalCode: '480661' },
      { name: 'Gopalganj', postalCode: '480661' },
      { name: 'Lakhnadon Rd', postalCode: '480661' },
      { name: 'Seoni City Wide', postalCode: '480661' },
    ],
    priceRange: '₹85 - ₹1850',
    fssaiLicense: '11424850000123',
    gstin: '23AAACD1234E1Z5',
  },
  social: {
    instagram: 'https://www.instagram.com/dugdhsar.in/',
    instagramHandle: '@dugdhsar.in',
  },
  verification: {
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
    bingSiteVerification: process.env.BING_SITE_VERIFICATION || '',
    indexNowKey: 'dugdhsar2026indexnow',
  },
  analytics: {
    cloudflareWebAnalyticsToken: process.env.CF_BEACON_TOKEN || '',
  },
};
