export interface ImageLicense {
  name: string;
  url: string;
}

export interface ImageMetadata {
  sourceUrl: string;
  creator: string;
  license: ImageLicense;
  attribution: string;
  thumbnailUrl: string;
  /** Optional direct image URL used when a provider thumbnail cannot load. */
  originalUrl?: string;
  fetchedAt: string;
}

const HTML_ENTITY_REPLACEMENTS: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  ldquor: '„',
  lsaquo: '‹',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  rdquo: '”',
  rsaquo: '›',
  rsquo: '’',
  quot: '"',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return HTML_ENTITY_REPLACEMENTS[body.toLowerCase()] ?? entity;
  });
}

/** Convert provider HTML attribution into safe, readable native text. */
export function sanitizeAttribution(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<\s*\/\s*(p|div|li)\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLicenseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Return whether an image license is allowed for display in the app. */
export function isCompatibleLicense(license: ImageLicense | null | undefined): boolean {
  if (!license?.name) return false;

  const name = normalizeLicenseName(license.name);
  return (
    /^CC0(?:\s|$)/.test(name) ||
    /^PUBLIC DOMAIN(?:\s|$)/.test(name) ||
    /^CC BY(?:-SA)?(?:\s|$)/.test(name)
  );
}

/** Keep only images whose license is explicitly compatible. */
export function filterCompatibleImages(images: readonly ImageMetadata[]): ImageMetadata[] {
  return images.filter((image) => isCompatibleLicense(image.license));
}
