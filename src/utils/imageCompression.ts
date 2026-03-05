/**
 * Image compression utility
 * Compresses images before upload to reduce payload size
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const defaultOptions: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeKB: 500,
};

/**
 * Compress an image file and return as base64
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const opts = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(
            opts.maxWidth! / width,
            opts.maxHeight! / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Start with the specified quality
        let quality = opts.quality!;
        let result = canvas.toDataURL('image/jpeg', quality);

        // If we have a max size, iteratively reduce quality until we're under the limit
        if (opts.maxSizeKB) {
          const maxBytes = opts.maxSizeKB * 1024;
          let attempts = 0;
          const maxAttempts = 10;

          while (getBase64Size(result) > maxBytes && attempts < maxAttempts && quality > 0.1) {
            quality -= 0.1;
            result = canvas.toDataURL('image/jpeg', quality);
            attempts++;
          }

          // If still too large, resize further
          if (getBase64Size(result) > maxBytes) {
            const scale = Math.sqrt(maxBytes / getBase64Size(result));
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            result = canvas.toDataURL('image/jpeg', 0.7);
          }
        }

        resolve(result);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Get the size of a base64 string in bytes
 */
const getBase64Size = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;
  // Calculate size: base64 has 4 chars per 3 bytes, with padding
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
};

/**
 * Compress multiple images
 */
export const compressImages = async (
  files: File[],
  options: CompressOptions = {}
): Promise<string[]> => {
  const results: string[] = [];
  for (const file of files) {
    const compressed = await compressImage(file, options);
    results.push(compressed);
  }
  return results;
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
