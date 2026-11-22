import React, { useEffect } from 'react';
import { siteConfig, isPlaceholderValue } from '../config/site';
import { RouteMeta, PUBLIC_ROUTES_META, staticContent } from '../content';

/**
 * Escapes unsafe HTML characters to prevent XSS in JSON-LD injection
 */
export function safeJsonLdString(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export interface PageSEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  jsonLd?: object | object[];
  keywords?: string[];
}

/**
 * Helper to update or create a <meta> element in document.head
 */
function updateMetaTag(attributeName: 'name' | 'property', attributeValue: string, content?: string): void {
  if (typeof document === 'undefined') return;

  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    if (element) {
      element.remove();
    }
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Helper to update or create a <link> element in document.head
 */
function updateLinkTag(rel: string, href?: string): void {
  if (typeof document === 'undefined') return;

  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!href) {
    if (element) {
      element.remove();
    }
    return;
  }

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

/**
 * Helper to update or create the JSON-LD script tag in document.head
 */
function updateJsonLd(data?: object | object[]): void {
  if (typeof document === 'undefined') return;

  const scriptId = 'dugdhsar-page-schema';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = safeJsonLdString(data);
}

/**
 * React Hook for dynamic page SEO management.
 * Dynamically updates document.title, description, canonical link,
 * robots, OpenGraph and Twitter tags on route navigation in React SPA.
 */
export function usePageSEO(options?: PageSEOProps | string): void {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // Normalizing options
    let resolvedOptions: PageSEOProps = {};
    if (typeof options === 'string') {
      resolvedOptions = { title: options };
    } else if (options) {
      resolvedOptions = options;
    }

    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const matchedRouteMeta = PUBLIC_ROUTES_META.find((r) => r.path === currentPath);

    // Title resolution
    const rawTitle = resolvedOptions.title || matchedRouteMeta?.title || siteConfig.name;
    const finalTitle = rawTitle.includes(siteConfig.name) 
      ? rawTitle 
      : `${rawTitle} — ${siteConfig.name}`;
    document.title = finalTitle;

    // Description
    const description = resolvedOptions.description || matchedRouteMeta?.description || siteConfig.description;
    updateMetaTag('name', 'description', description);

    // Keywords
    if (resolvedOptions.keywords && resolvedOptions.keywords.length > 0) {
      updateMetaTag('name', 'keywords', resolvedOptions.keywords.join(', '));
    }

    // Canonical URL
    const canonical = resolvedOptions.canonical || matchedRouteMeta?.canonical || `${siteConfig.url}${currentPath === '/' ? '' : currentPath}`;
    updateLinkTag('canonical', canonical);

    // Robots meta tag
    if (resolvedOptions.noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // OpenGraph meta tags
    const ogType = resolvedOptions.ogType || matchedRouteMeta?.ogType || 'website';
    const ogImage = resolvedOptions.ogImage || matchedRouteMeta?.ogImage || siteConfig.ogImage;
    const ogImageAlt = resolvedOptions.ogImageAlt || `${siteConfig.name} Pure Gir Cow Dairy`;

    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', canonical);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:site_name', siteConfig.name);
    updateMetaTag('property', 'og:locale', 'en_IN');
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:alt', ogImageAlt);

    // Twitter Card meta tags
    const twitterCard = resolvedOptions.twitterCard || 'summary_large_image';
    updateMetaTag('name', 'twitter:card', twitterCard);
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:site', '@dugdhsar.in');
    updateMetaTag('name', 'twitter:creator', '@dugdhsar.in');

    // Geo / Local SEO
    updateMetaTag('name', 'geo.region', 'IN-MP');
    updateMetaTag('name', 'geo.placename', 'Seoni, Madhya Pradesh, India');
    updateMetaTag('name', 'geo.position', `${siteConfig.location.latitude};${siteConfig.location.longitude}`);
    updateMetaTag('name', 'ICBM', `${siteConfig.location.latitude}, ${siteConfig.location.longitude}`);

    // Structured Data (JSON-LD)
    if (resolvedOptions.jsonLd) {
      updateJsonLd(resolvedOptions.jsonLd);
    } else if (matchedRouteMeta) {
      const generatedGraph = generateSchemaGraph(matchedRouteMeta);
      updateJsonLd(generatedGraph);
    }
  }, [
    options,
    typeof options === 'object' ? options?.title : options,
    typeof options === 'object' ? options?.description : undefined,
    typeof options === 'object' ? options?.canonical : undefined,
    typeof options === 'object' ? options?.ogImage : undefined,
    typeof options === 'object' ? options?.noindex : undefined,
  ]);
}

/**
 * Generates unified Schema.org graph for any public route
 */
export function generateSchemaGraph(route: RouteMeta): object {
  const graph: any[] = [];

  // 1. Organization
  const orgNode: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteConfig.url}/#logo`,
      url: `${siteConfig.url}/assets/aistudio/1000095624-clean_337007be.png`,
      caption: `${siteConfig.name} Logo`,
    },
    image: siteConfig.ogImage,
    sameAs: [siteConfig.social.instagram],
  };
  if (!isPlaceholderValue(siteConfig.legalName)) {
    orgNode.legalName = siteConfig.legalName;
  }
  if (!isPlaceholderValue(siteConfig.contact.email)) {
    orgNode.email = siteConfig.contact.email;
  }
  if (!isPlaceholderValue(siteConfig.contact.phoneFormatted)) {
    orgNode.telephone = siteConfig.contact.phoneFormatted;
  }
  if (siteConfig.foundingYear) {
    orgNode.foundingDate = `${siteConfig.foundingYear}-01-01`;
  }
  graph.push(orgNode);

  // 2. LocalBusiness / FoodEstablishment
  const addressNode: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: siteConfig.location.city,
    addressRegion: siteConfig.location.state,
    addressCountry: siteConfig.location.country,
  };
  if (!isPlaceholderValue(siteConfig.location.street)) {
    addressNode.streetAddress = siteConfig.location.street;
  }
  if (!isPlaceholderValue(siteConfig.location.postalCode)) {
    addressNode.postalCode = siteConfig.location.postalCode;
  }

  const localBusinessNode: Record<string, unknown> = {
    '@type': ['LocalBusiness', 'FoodEstablishment'],
    '@id': `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    description: siteConfig.description,
    image: siteConfig.ogImage,
    url: siteConfig.url,
    priceRange: siteConfig.business.priceRange,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash on Delivery, Razorpay (UPI, Cards, Net Banking)',
    address: addressNode,
    openingHoursSpecification: siteConfig.business.openingHoursSpecification.map((spec) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: spec.dayOfWeek,
      opens: spec.opens,
      closes: spec.closes,
    })),
    areaServed: siteConfig.business.areaServed.map((area) => ({
      '@type': 'Place',
      name: area.name,
      postalCode: area.postalCode,
    })),
  };
  if (!isPlaceholderValue(siteConfig.contact.phoneFormatted)) {
    localBusinessNode.telephone = siteConfig.contact.phoneFormatted;
  }
  if (!isPlaceholderValue(siteConfig.contact.email)) {
    localBusinessNode.email = siteConfig.contact.email;
  }
  graph.push(localBusinessNode);

  // 3. WebSite with SearchAction
  graph.push({
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });

  // 4. BreadcrumbList for inner routes
  if (route.breadcrumbs && route.breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${route.canonical}#breadcrumb`,
      itemListElement: route.breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    });
  }

  // 5. Route-Specific Entities
  // Product Detail Schema
  if (route.path.startsWith('/products/') && route.jsonLdType === 'Product') {
    const slug = route.path.replace('/products/', '');
    const product = staticContent.products.find((p) => p.slug === slug);
    if (product) {
      const primaryVariant = product.variants[0];
      graph.push({
        '@type': 'Product',
        '@id': `${route.canonical}#product`,
        name: product.name,
        alternateName: product.hindiName,
        description: product.description,
        image: product.images.map((img) => `${siteConfig.url}${img.imageUrl}`),
        sku: primaryVariant?.sku || `DUG-${product.id}`,
        brand: {
          '@type': 'Brand',
          name: siteConfig.name,
        },
        offers: {
          '@type': 'Offer',
          url: route.canonical,
          priceCurrency: 'INR',
          price: (primaryVariant?.pricePaise || 17000) / 100,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: 'https://schema.org/InStock',
          seller: { '@id': `${siteConfig.url}/#organization` },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating.toFixed(1),
          reviewCount: Math.max(1, product.reviewsCount),
          bestRating: '5',
          worstRating: '1',
        },
      });
    }
  }

  // Article / Blog Post Schema
  if (route.path.startsWith('/journal/') && route.jsonLdType === 'Article') {
    const slug = route.path.replace('/journal/', '');
    const post = staticContent.journalPosts.find((p) => p.slug === slug);
    if (post) {
      graph.push({
        '@type': 'Article',
        '@id': `${route.canonical}#article`,
        headline: post.title,
        description: post.excerpt,
        image: `${siteConfig.url}${post.coverImage}`,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: {
          '@type': 'Person',
          name: post.author,
          jobTitle: post.authorRole,
        },
        publisher: { '@id': `${siteConfig.url}/#organization` },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': route.canonical,
        },
      });
    }
  }

  // FAQPage Schema
  if (route.path === '/faq' || route.path === '/') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${route.canonical}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What makes DUGDHSAR Gir Cow Milk 100% pure A2 milk?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our herd consists exclusively of genetically certified Bos Indicus Gir cows tested for the A2/A2 beta-casein allele. No Holstein or Jersey crossbreeding is practiced, ensuring natural, easy digestion with zero BCM-7 inflammatory peptides.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is DUGDHSAR Vedic Bilona Ghee prepared?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We follow the authentic 5-stage Ayurvedic Bilona method: fresh A2 milk is boiled on slow embers, cultured into probiotic dahi, bidirectionally churned with wooden churners to extract white makhan, and clarified into golden granular ghee.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the morning delivery timings in Seoni?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our chilled fleet dispatches daily morning milk bottles between 5:00 AM and 10:00 AM across Sanjay Vihar Colony, Sufi Nagar, Barghat Road, and throughout Seoni city.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are DUGDHSAR glass bottles sterilized and eco-friendly?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, every bottle is made from pharmaceutical-grade recyclable glass, washed through a 4-stage high-temperature sterilization cycle, hermetically sealed, and delivered without any plastic leeching.',
          },
        },
      ],
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
