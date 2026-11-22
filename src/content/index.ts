/**
 * Content Registry & Public Route Definitions for Static Prerendering (SSG),
 * Technical SEO, Metadata & Answer Engine Optimization (AEO).
 */

import { siteConfig } from '../config/site';
import { INITIAL_PRODUCTS, INITIAL_JOURNAL_POSTS, INITIAL_CATEGORIES } from '../data/seedData';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  canonical: string;
  h1: string;
  isPublic: boolean;
  ogType: 'website' | 'article' | 'product';
  ogImage?: string;
  jsonLdType?: string;
  breadcrumbs: Array<{ name: string; url: string }>;
  priority: number;
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const staticContent = {
  products: INITIAL_PRODUCTS,
  categories: INITIAL_CATEGORIES,
  journalPosts: INITIAL_JOURNAL_POSTS,
};

export const PUBLIC_ROUTES_META: RouteMeta[] = [
  // 1. Homepage
  {
    path: '/',
    title: `${siteConfig.name} — A2 Milk & Dairy Delivery Subscription in Seoni, MP`,
    description: siteConfig.description,
    canonical: `${siteConfig.url}/`,
    h1: 'Dugdhsar: A2 Milk & Dairy Delivery in Seoni, Madhya Pradesh',
    isPublic: true,
    ogType: 'website',
    ogImage: siteConfig.ogImage,
    jsonLdType: 'LocalBusiness',
    breadcrumbs: [{ name: 'Home', url: `${siteConfig.url}/` }],
    priority: 1.0,
    changeFreq: 'daily',
  },

  // 2. Brand & Heritage
  {
    path: '/our-story',
    title: `Our 60 Years Vedic Heritage — ${siteConfig.name}`,
    description: 'Learn about DUGDHSAR 60-year Vedic dairy heritage in Seoni, MP. Certified pure Gir cows, ethical Ahimsa milking, and cruelty-free organic farming.',
    canonical: `${siteConfig.url}/our-story`,
    h1: '60 Years of Sacred Gir Cow Stewardship & Vedic Dairy Heritage',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Our Story', url: `${siteConfig.url}/our-story` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  },
  {
    path: '/our-craft',
    title: `Traditional Bilona Vidhi & Milk Craft — ${siteConfig.name}`,
    description: 'Discover the ancient 5-stage Bilona churning process: curd-churned golden ghee made with wooden churners and low-heat simmering in Seoni.',
    canonical: `${siteConfig.url}/our-craft`,
    h1: 'The Ancient Art of Vedic Bilona Churning & Pure Dairy Craft',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Our Craft', url: `${siteConfig.url}/our-craft` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  },
  {
    path: '/quality',
    title: `Purity Assays & Low-Temp Pasteurization — ${siteConfig.name}`,
    description: 'Explore DUGDHSAR 26-point daily purity testing, A2/A2 DNA certification, zero adulteration guarantee, and low-temp vat pasteurization.',
    canonical: `${siteConfig.url}/quality`,
    h1: 'Uncompromising 26-Point Laboratory Purity & Cold-Chain Protocol',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Quality & Testing', url: `${siteConfig.url}/quality` },
    ],
    priority: 0.8,
    changeFreq: 'weekly',
  },

  // 3. Commerce & Catalog
  {
    path: '/shop',
    title: `All Pure Vedic Provisions — ${siteConfig.name}`,
    description: 'Browse farm-fresh A2 Gir cow milk in sterile glass bottles, traditional bilona ghee, malai paneer, and earthen-pot dahi delivered in Seoni.',
    canonical: `${siteConfig.url}/shop`,
    h1: 'Farm-Fresh Vedic A2 Dairy & Pure Provisions',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
    ],
    priority: 0.9,
    changeFreq: 'daily',
  },
  {
    path: '/products',
    title: `Dairy Catalog & Daily Subscriptions — ${siteConfig.name}`,
    description: 'Order 100% pure A2 milk, granular bilona ghee, and fresh artisanal dairy staples. Flexible morning delivery before 11 AM in Seoni.',
    canonical: `${siteConfig.url}/products`,
    h1: 'DUGDHSAR Artisanal Dairy Provisions & Morning Subscriptions',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Products', url: `${siteConfig.url}/products` },
    ],
    priority: 0.9,
    changeFreq: 'daily',
  },

  // Collections (Categories)
  {
    path: '/products/milk',
    title: `Fresh A2 Gir Cow Whole & Skimmed Milk — ${siteConfig.name}`,
    description: 'Raw chilled and gently vat-pasteurized A2 milk in recyclable glass bottles. Zero plastic, 100% Gir cow genetics, rich natural cream layer.',
    canonical: `${siteConfig.url}/products/milk`,
    h1: 'Fresh A2 Indigenous Gir Cow Whole & Toned Milk',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'A2 Milk', url: `${siteConfig.url}/products/milk` },
    ],
    priority: 0.9,
    changeFreq: 'daily',
  },
  {
    path: '/products/ghee',
    title: `Traditional Vedic Bilona Cow Ghee — ${siteConfig.name}`,
    description: 'Golden, granular danedar A2 bilona ghee churned bidirectionally from whole curd. Unmatched Ayurvedic aroma, high smoke point, glass jars.',
    canonical: `${siteConfig.url}/products/ghee`,
    h1: 'Traditional Vedic Bilona Churned Cow Ghee',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'Bilona Ghee', url: `${siteConfig.url}/products/ghee` },
    ],
    priority: 0.9,
    changeFreq: 'daily',
  },
  {
    path: '/products/paneer',
    title: `Fresh A2 Malai Paneer & Cottage Cheese — ${siteConfig.name}`,
    description: 'Soft, melt-in-the-mouth A2 malai cottage cheese crafted daily using natural lemon curdling. No cornstarch, no palm oil, pure milk fat.',
    canonical: `${siteConfig.url}/products/paneer`,
    h1: 'Fresh Artisanal A2 Malai Paneer',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'Malai Paneer', url: `${siteConfig.url}/products/paneer` },
    ],
    priority: 0.8,
    changeFreq: 'daily',
  },
  {
    path: '/products/curd',
    title: `Earthen-Pot Probiotic A2 Curd (Dahi) — ${siteConfig.name}`,
    description: 'Thick, creamy, naturally sweet dahi set with traditional heirloom cultures. Rich in natural probiotics and gentle on the stomach.',
    canonical: `${siteConfig.url}/products/curd`,
    h1: 'Probiotic Earthen Pot Vedic A2 Curd',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'A2 Curd', url: `${siteConfig.url}/products/curd` },
    ],
    priority: 0.8,
    changeFreq: 'daily',
  },
  {
    path: '/products/butter',
    title: `Fresh Vedic White Makhan (Butter) — ${siteConfig.name}`,
    description: 'Hand-churned unsalted white butter from cultured curd. Traditional village flavour, zero artificial color, perfect for hot rotis & paranthas.',
    canonical: `${siteConfig.url}/products/butter`,
    h1: 'Pure A2 White Cultured Makhan',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'White Butter', url: `${siteConfig.url}/products/butter` },
    ],
    priority: 0.8,
    changeFreq: 'daily',
  },
  {
    path: '/products/khoya-mawa',
    title: `Slow-Simmered Vedic A2 Khoya (Mawa) — ${siteConfig.name}`,
    description: 'Authentic granular khoya slow-reduced over gentle embers in cast-iron kadhais. 100% pure Gir cow milk with zero adulteration.',
    canonical: `${siteConfig.url}/products/khoya-mawa`,
    h1: 'Slow-Simmered Vedic A2 Khoya & Mawa',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: 'Khoya Mawa', url: `${siteConfig.url}/products/khoya-mawa` },
    ],
    priority: 0.8,
    changeFreq: 'daily',
  },

  // 4. Contact, FAQ & Local Service Area
  {
    path: '/contact',
    title: `Contact Us — ${siteConfig.name}`,
    description: `Contact ${siteConfig.name} for A2 milk and dairy delivery subscriptions in ${siteConfig.business.deliveryArea}.`,
    canonical: `${siteConfig.url}/contact`,
    h1: `Contact ${siteConfig.name}`,
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Contact', url: `${siteConfig.url}/contact` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  },
  {
    path: '/faq',
    title: `Frequently Asked Questions (FAQ) — ${siteConfig.name}`,
    description: 'Answers about Vedic Gir cow A2 milk, bilona ghee curd churning, daily morning delivery timings, glass bottle reuse, and subscriptions in Seoni.',
    canonical: `${siteConfig.url}/faq`,
    h1: 'Frequently Asked Questions About Pure A2 Dairy',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'FAQ', url: `${siteConfig.url}/faq` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  },
  {
    path: '/store-locator',
    title: `Dairy Store Locator & Delivery Zones — ${siteConfig.name}`,
    description: 'Check daily morning cold-chain delivery service across Sanjay Vihar Colony, Sufi Nagar, Barghat Road, and Seoni city zones.',
    canonical: `${siteConfig.url}/store-locator`,
    h1: 'DUGDHSAR Physical Store Locator & Delivery Coverage in Seoni',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Store Locator', url: `${siteConfig.url}/store-locator` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  },

  // 5. Journal / Blog Index
  {
    path: '/journal',
    title: `Vedic Dairy Journal & Ayurvedic Research — ${siteConfig.name}`,
    description: 'Articles and research on A2 beta-casein genetics, Charaka Samhita bilona ghee churning science, digestion benefits, and ethical cow care.',
    canonical: `${siteConfig.url}/journal`,
    h1: 'DUGDHSAR Vedic Dairy Journal & Nutritional Science',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Journal', url: `${siteConfig.url}/journal` },
    ],
    priority: 0.8,
    changeFreq: 'weekly',
  },

  // 6. Legal Pages
  {
    path: '/privacy-policy',
    title: `Privacy Policy — ${siteConfig.name}`,
    description: `Privacy Policy for ${siteConfig.name}: Google Sign-In scopes (openid, email, profile), data stored on Cloudflare D1/KV, Razorpay payments, retention, user rights, and Grievance Officer details.`,
    canonical: `${siteConfig.url}/privacy-policy`,
    h1: 'Privacy Policy',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Privacy Policy', url: `${siteConfig.url}/privacy-policy` },
    ],
    priority: 0.6,
    changeFreq: 'monthly',
  },
  {
    path: '/terms-and-conditions',
    title: `Terms & Conditions — ${siteConfig.name}`,
    description: `Terms and Conditions governing A2 milk and dairy delivery subscriptions, one-time orders, accounts, and payments on ${siteConfig.name} in Seoni, Madhya Pradesh.`,
    canonical: `${siteConfig.url}/terms-and-conditions`,
    h1: 'Terms & Conditions',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Terms & Conditions', url: `${siteConfig.url}/terms-and-conditions` },
    ],
    priority: 0.6,
    changeFreq: 'monthly',
  },
  {
    path: '/shipping-policy',
    title: `Shipping & Delivery Policy — ${siteConfig.name}`,
    description: `Local delivery coverage, morning and evening delivery windows, cutoff times, and doorstep handoff terms for ${siteConfig.name} in Seoni, Madhya Pradesh.`,
    canonical: `${siteConfig.url}/shipping-policy`,
    h1: 'Shipping & Delivery Policy',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Shipping Policy', url: `${siteConfig.url}/shipping-policy` },
    ],
    priority: 0.6,
    changeFreq: 'monthly',
  },
  {
    path: '/cancellation-refund',
    title: `Cancellation & Refund Policy — ${siteConfig.name}`,
    description: `Cancellation cutoff rules, subscription pause and skip instructions, damaged item reporting, and Razorpay refund timelines for ${siteConfig.name}.`,
    canonical: `${siteConfig.url}/cancellation-refund`,
    h1: 'Cancellation & Refund Policy',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Cancellation & Refund Policy', url: `${siteConfig.url}/cancellation-refund` },
    ],
    priority: 0.6,
    changeFreq: 'monthly',
  },
  {
    path: '/return-policy',
    title: `Bottle Return & Replacement Policy — ${siteConfig.name}`,
    description: `Guidelines for reusable glass bottle returns and replacement of damaged dairy deliveries with ${siteConfig.name} in Seoni, Madhya Pradesh.`,
    canonical: `${siteConfig.url}/return-policy`,
    h1: 'Bottle Return & Replacement Policy',
    isPublic: true,
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: `${siteConfig.url}/` },
      { name: 'Return Policy', url: `${siteConfig.url}/return-policy` },
    ],
    priority: 0.5,
    changeFreq: 'monthly',
  },
];

// Dynamically generate routes for each individual product
INITIAL_PRODUCTS.forEach((p) => {
  PUBLIC_ROUTES_META.push({
    path: `/products/${p.slug}`,
    title: `${p.name} (${p.hindiName}) — ${siteConfig.name}`,
    description: p.description.slice(0, 155),
    canonical: `${siteConfig.url}/products/${p.slug}`,
    h1: p.name,
    isPublic: true,
    ogType: 'product',
    ogImage: p.images[0]?.imageUrl || siteConfig.ogImage,
    jsonLdType: 'Product',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Shop', url: `${siteConfig.url}/shop` },
      { name: p.name, url: `${siteConfig.url}/products/${p.slug}` },
    ],
    priority: 0.9,
    changeFreq: 'daily',
  });
});

// Dynamically generate routes for each journal article
INITIAL_JOURNAL_POSTS.forEach((post) => {
  PUBLIC_ROUTES_META.push({
    path: `/journal/${post.slug}`,
    title: `${post.title.slice(0, 50)}... — ${siteConfig.name}`,
    description: post.excerpt.slice(0, 155),
    canonical: `${siteConfig.url}/journal/${post.slug}`,
    h1: post.title,
    isPublic: true,
    ogType: 'article',
    ogImage: post.coverImage || siteConfig.ogImage,
    jsonLdType: 'Article',
    breadcrumbs: [
      { name: 'Home', url: siteConfig.url },
      { name: 'Journal', url: `${siteConfig.url}/journal` },
      { name: post.title, url: `${siteConfig.url}/journal/${post.slug}` },
    ],
    priority: 0.8,
    changeFreq: 'monthly',
  });
});
