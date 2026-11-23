/**
 * Safe accessors and map/location URL builders backed by `src/config/site.ts`.
 *
 * Kept separate from `src/config/site.ts` so user-edited values in `site.ts`
 * are never overwritten, while guaranteeing:
 * - Every shop map embed and "Get Directions" link uses `siteConfig.location.latitude`
 *   and `siteConfig.location.longitude` (`q=lat,lng` / `destination=lat,lng`), never
 *   address text that Google Maps might geocode elsewhere.
 * - Optional fields (`gstin`, `legalName`, `fssaiLicense`, `phone`, `email`, etc.)
 *   can be cleanly omitted whenever empty (e.g., `gstin: ''` for non-GST businesses).
 */

import { siteConfig } from './site';

const PLACEHOLDER_REGEX = /\[[^\]]+\]/;

/** Returns true when `value` is a non-empty string after trimming. */
export function hasText(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Returns true when `value` contains an unreplaced `[PLACEHOLDER]` token. */
export function hasPlaceholder(value?: string | null): boolean {
  return hasText(value) && PLACEHOLDER_REGEX.test(value.trim());
}

/** Returns true when `value` is non-empty AND does not contain a `[PLACEHOLDER]` token. */
export function hasRealValue(value?: string | null): value is string {
  return hasText(value) && !hasPlaceholder(value);
}

/**
 * Returns the FSSAI Registration Number from `siteConfig.business`, supporting either
 * `fssaiRegNo` (if added by the user) or the default `fssaiLicense` field.
 */
export function getFssaiRegNo(): string {
  const biz = siteConfig.business as typeof siteConfig.business & { fssaiRegNo?: string };
  const raw = hasText(biz.fssaiRegNo) ? biz.fssaiRegNo : biz.fssaiLicense;
  return hasText(raw) ? raw.trim() : '';
}

/**
 * Returns the GSTIN only when intentionally populated.
 * Returns `''` when empty or still a placeholder so non-GST businesses never show a GSTIN line.
 */
export function getGstin(): string {
  const raw = siteConfig.business.gstin;
  if (!hasText(raw)) return '';
  return raw.trim();
}

/** True only when GSTIN is a real, non-empty, non-placeholder value. */
export function hasGstin(): boolean {
  return hasRealValue(getGstin());
}

/** Returns digits + optional leading `+` suitable for `tel:` links, or `''` if unusable. */
export function getCleanTelHref(phone = siteConfig.contact.phone): string {
  if (!hasRealValue(phone)) return '';
  return phone.replace(/[^+\d]/g, '');
}

/** Returns digits-only string suitable for `https://wa.me/<digits>`, or `''` if unusable. */
export function getCleanWhatsappDigits(whatsapp = siteConfig.contact.whatsapp): string {
  if (!hasRealValue(whatsapp)) return '';
  const digits = whatsapp.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Canonical shop coordinates from `src/config/site.ts` (latitude, longitude). */
export function getShopCoordinates(): { latitude: number; longitude: number } {
  return {
    latitude: siteConfig.location.latitude,
    longitude: siteConfig.location.longitude,
  };
}

/** Formatted decimal coordinates string (`22.085917, 79.55775`). */
export function getShopCoordinatesLabel(): string {
  const { latitude, longitude } = getShopCoordinates();
  return `${latitude}, ${longitude}`;
}

/**
 * Google Maps embed iframe URL pinned strictly to `siteConfig.location` coordinates
 * (`q=lat,lng&z=17&output=embed`, NEVER address text).
 */
export function getShopMapEmbedUrl(zoom = 17): string {
  const { latitude, longitude } = getShopCoordinates();
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;
}

/**
 * Google Maps driving directions URL pinned strictly to `siteConfig.location` coordinates
 * (`destination=lat,lng`, NEVER address text).
 */
export function getShopDirectionsUrl(): string {
  const { latitude, longitude } = getShopCoordinates();
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/**
 * Google Maps pin search URL pinned strictly to `siteConfig.location` coordinates
 * (`q=lat,lng`, NEVER address text).
 */
export function getShopMapsSearchUrl(): string {
  const { latitude, longitude } = getShopCoordinates();
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

/**
 * Separate Gaushala / Farm location (distinct from the Barghat Road, Seoni retail shop).
 * Currently identified by Plus Code `WMJJ+X34` in Sukla, MP 480771 (no numeric lat/lng yet).
 */
export const GAUSHALA_FARM_LOCATION = {
  id: 'sukla-farm',
  name: 'Dugdhsar Gaushala Sanctuary & Farm (Sukla — Separate from Seoni Shop)',
  shortName: 'Dugdhsar Gaushala Sanctuary (Farm — Sukla)',
  type: 'Farm & Gaushala Sanctuary (Separate Location from Seoni Retail Shop)',
  plusCode: 'WMJJ+X34',
  address: 'WMJJ+X34, Sukla, Madhya Pradesh 480771',
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    'WMJJ+X34, Sukla, Madhya Pradesh 480771'
  )}`,
} as const;
