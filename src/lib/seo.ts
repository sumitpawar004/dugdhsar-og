/**
 * SEO & Schema.org JSON-LD Generator
 * Produces valid, Google Rich Results compliant, safe-escaped structured data.
 */

import { siteConfig } from '../config/site';
import { RouteMeta, staticContent } from '../content';

/**
 * Escapes unsafe HTML characters to prevent XSS in JSON-LD injection
 */
export function safeJsonLdString(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Generates unified Schema.org graph for any public route
 */
export function generateSchemaGraph(route: RouteMeta): object {
  const graph: any[] = [];

  // 1. Organization
  graph.push({
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteConfig.url}/#logo`,
      url: `${siteConfig.url}/assets/aistudio/1000095624-clean_337007be.png`,
      caption: `${siteConfig.name} Gir Cow Emblem`,
    },
    image: siteConfig.ogImage,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phoneFormatted,
    sameAs: [siteConfig.social.instagram],
    foundingDate: `${siteConfig.foundingYear}-01-01`,
  });

  // 2. LocalBusiness / DairyStore
  graph.push({
    '@type': ['LocalBusiness', 'DairyStore', 'FoodEstablishment'],
    '@id': `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    image: siteConfig.ogImage,
    url: siteConfig.url,
    telephone: siteConfig.contact.phoneFormatted,
    email: siteConfig.contact.email,
    priceRange: siteConfig.business.priceRange,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.location.street,
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      postalCode: siteConfig.location.postalCode,
      addressCountry: siteConfig.location.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.location.latitude,
      longitude: siteConfig.location.longitude,
    },
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
    hasMap: siteConfig.location.googleMapsUrl,
  });

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
