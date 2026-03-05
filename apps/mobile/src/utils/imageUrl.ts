import Constants from 'expo-constants';

// Get base URL without /api suffix
// Set via environment variable: API_URL=http://YOUR_IP:3001/api npx expo start
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';
const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Converts a relative image path to a full URL for React Native
 * @param path - Relative path like "/uploads/image.avif" or null
 * @returns Full URL or null
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Already a full URL or base64 data
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  // Relative path - prepend server URL
  return `${SERVER_BASE_URL}${path}`;
}
