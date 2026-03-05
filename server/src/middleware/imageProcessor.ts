import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`✅ Created uploads directory: ${uploadsDir}`);
}

// Configure multer for memory storage (we'll process with sharp before saving)
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter,
});

/**
 * Process image: resize to max 1200px width, convert to AVIF with 80% quality
 * Returns the relative file path (e.g., /uploads/user_1_1706025600.avif)
 */
export async function processImage(
  imageBuffer: Buffer,
  prefix: string = 'image',
  id?: string | number
): Promise<string> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = id 
      ? `${prefix}_${id}_${timestamp}.avif`
      : `${prefix}_${timestamp}.avif`;
    const filepath = path.join(uploadsDir, filename);

    // Process image with sharp
    await sharp(imageBuffer)
      .resize(1200, null, {
        withoutEnlargement: true, // Don't enlarge if smaller than 1200px
        fit: 'inside', // Maintain aspect ratio
      })
      .avif({
        quality: 80,
        effort: 4, // Balance between compression time and file size
      })
      .toFile(filepath);

    // Return relative path for database storage
    return `/uploads/${filename}`;
  } catch (error: any) {
    logger.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Convert base64 string to buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.includes(',')
      ? base64String.split(',')[1]
      : base64String;
    
    return Buffer.from(base64Data, 'base64');
  } catch (error: any) {
    logger.error('Base64 conversion error:', error);
    throw new Error(`Invalid base64 image: ${error.message}`);
  }
}

/**
 * Middleware to process uploaded files or base64 images
 * Handles both multipart/form-data file uploads and base64 strings in request body
 */
export async function processImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Process uploaded files (from multer)
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const file of files) {
        if (file.buffer) {
          const prefix = file.fieldname || 'upload';
          const processedPath = await processImage(file.buffer, prefix);
          
          // Store processed path in request for route handlers
          if (!req.body.processedImages) {
            req.body.processedImages = [];
          }
          req.body.processedImages.push(processedPath);
        }
      }
    }

    // Process base64 images from request body
    const imageFields = ['images', 'photos', 'photo', 'thenPhoto', 'nowPhoto', 'imageLink', 'groupPhoto'];
    
    for (const field of imageFields) {
      if (req.body[field]) {
        if (Array.isArray(req.body[field])) {
          // Handle array of images
          const processedPaths: string[] = [];
          
          for (let i = 0; i < req.body[field].length; i++) {
            const imageData = req.body[field][i];
            
          // Skip if already a URL/path (not base64)
          if (typeof imageData === 'string' && !imageData.startsWith('data:image')) {
              // Already a path/URL, keep it
              processedPaths.push(imageData);
              continue;
            }
            
            // Process base64 image
            if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
              try {
                const buffer = base64ToBuffer(imageData);
                const prefix = field === 'photos' ? 'photo' : field;
                const processedPath = await processImage(buffer, prefix);
                processedPaths.push(processedPath);
              } catch (error: any) {
                logger.warn(`Failed to process ${field}[${i}]:`, error.message);
                // Keep original if processing fails
                processedPaths.push(imageData);
              }
            } else {
              processedPaths.push(imageData);
            }
          }
          
          req.body[field] = processedPaths;
        } else if (typeof req.body[field] === 'string') {
          // Handle single image
          const imageData = req.body[field];
          
          // Skip if already a URL/path (not base64)
          if (!imageData.startsWith('data:image')) {
            // Already a path/URL, keep it
            continue;
          }
          
          // Process base64 image
          if (imageData.startsWith('data:image')) {
            try {
              const buffer = base64ToBuffer(imageData);
              const prefix = field === 'photos' ? 'photo' : field;
              const processedPath = await processImage(buffer, prefix);
              req.body[field] = processedPath;
            } catch (error: any) {
              logger.warn(`Failed to process ${field}:`, error.message);
              // Keep original if processing fails
            }
          }
        }
      }
    }

    next();
  } catch (error: any) {
    logger.error('Image processing middleware error:', error);
    res.status(500).json({
      error: 'Image processing failed',
      details: error.message || 'Internal server error',
    });
  }
}

/**
 * Middleware to handle single image upload
 */
export const uploadSingle = upload.single('image');

/**
 * Middleware to handle multiple image uploads
 */
export const uploadMultiple = upload.array('images', 10); // Max 10 images

/**
 * Middleware to handle multiple fields with images
 */
export const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'photos', maxCount: 5 },
  { name: 'photo', maxCount: 1 },
  { name: 'thenPhoto', maxCount: 1 },
  { name: 'nowPhoto', maxCount: 1 },
  { name: 'groupPhoto', maxCount: 1 },
]);

