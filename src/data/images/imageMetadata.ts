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
  fetchedAt: string;
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
