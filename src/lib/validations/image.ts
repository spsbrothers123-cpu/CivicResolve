import sharp from "sharp";

/**
 * Image security validation resource limits:
 * - 5 MB file size limit
 * - 16 Megapixel total resolution limit (prevents decompression bombs)
 * - 5000px maximum dimension (width or height)
 * - 16px minimum dimension (width or height)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (5,242,880 bytes)
const MAX_PIXELS = 16_000_000;         // 16 Megapixels
const MAX_DIMENSION = 5000;            // Maximum width or height
const MIN_DIMENSION = 16;              // Minimum width or height

export async function validateImageBuffer(
  buffer: Buffer,
  fileName: string
): Promise<{
  valid: boolean;
  detectedMime?: "image/jpeg" | "image/png" | "image/webp";
  error?: string;
}> {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { valid: false, error: "Image file is empty or corrupted." };
  }

  // 1. File size enforcement
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: "Image file exceeds 5MB limit." };
  }

  // 2. Initial file signature / magic bytes verification
  let detectedFormat: "jpeg" | "png" | "webp" | null = null;
  let detectedMime: "image/jpeg" | "image/png" | "image/webp" | null = null;

  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedFormat = "jpeg";
    detectedMime = "image/jpeg";
  }
  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A (\x89PNG\r\n\x1a\n)
  else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedFormat = "png";
    detectedMime = "image/png";
  }
  // WEBP: 'RIFF' at 0..3 and 'WEBP' at 8..11
  else if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    detectedFormat = "webp";
    detectedMime = "image/webp";
  }

  if (!detectedFormat || !detectedMime) {
    return {
      valid: false,
      error: "Invalid file signature. Only verified JPEG, PNG, and WEBP formats are accepted.",
    };
  }

  // 3. Validate file extension consistency
  const lowerName = fileName.toLowerCase().trim();
  const ext = lowerName.split(".").pop() || "";

  if (detectedFormat === "jpeg" && !["jpg", "jpeg"].includes(ext)) {
    return { valid: false, error: "File extension does not match detected JPEG data." };
  }
  if (detectedFormat === "png" && ext !== "png") {
    return { valid: false, error: "File extension does not match detected PNG data." };
  }
  if (detectedFormat === "webp" && ext !== "webp") {
    return { valid: false, error: "File extension does not match detected WEBP data." };
  }

  // 4. Deep decoding and resource limits verification via Sharp
  try {
    const image = sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_PIXELS,
    });

    const metadata = await image.metadata();

    if (!metadata || !metadata.format) {
      return { valid: false, error: "Image decoding failed: Unrecognized image structure." };
    }

    // Verify decoder format matches signature format
    if (metadata.format !== detectedFormat) {
      return {
        valid: false,
        error: "Image format mismatch between binary signature and image decoder.",
      };
    }

    // Reject animated or multi-page images (e.g. animated WebP, multi-page TIFF/GIF)
    if (metadata.pages && metadata.pages > 1) {
      return {
        valid: false,
        error: "Animated or multi-page images are not supported for civic evidence.",
      };
    }

    // Verify valid dimensions
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Image decoding failed: Missing image dimensions." };
    }

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      return {
        valid: false,
        error: `Image dimensions exceed the permitted maximum limit (${MAX_DIMENSION}x${MAX_DIMENSION}px).`,
      };
    }

    if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
      return {
        valid: false,
        error: `Image dimensions are below the permitted minimum limit (${MIN_DIMENSION}x${MIN_DIMENSION}px).`,
      };
    }

    if (metadata.width * metadata.height > MAX_PIXELS) {
      return {
        valid: false,
        error: "Total image pixel count exceeds the permitted resource limit.",
      };
    }

    // Force full raster statistics check to guarantee image stream is not truncated
    await image.stats();

    return { valid: true, detectedMime };
  } catch {
    // Return sanitized error without exposing internal decoder paths, C++ symbols, or memory addresses
    return {
      valid: false,
      error: "Image decoding failed: Corrupted, malformed, or unprocessable image payload.",
    };
  }
}
