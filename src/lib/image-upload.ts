const DEFAULT_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'bmp',
  'tif',
  'tiff',
  'svg',
  'ico',
])

export const IMAGE_UPLOAD_LABEL = 'PNG, JPG, JPEG, WebP, GIF, AVIF, BMP, TIFF, SVG, ICO'

export function isSupportedImageFile(file: { type?: string; name?: string }): boolean {
  if (file.type?.startsWith('image/')) {
    return true
  }

  const extension = file.name?.split('.').pop()?.toLowerCase()
  return !!extension && DEFAULT_IMAGE_EXTENSIONS.has(extension)
}

export function validateImageFile(
  file: { type?: string; name?: string; size?: number },
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  if (!isSupportedImageFile(file)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${IMAGE_UPLOAD_LABEL}.`,
    }
  }

  if (typeof file.size === 'number' && file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
    }
  }

  return { valid: true }
}